<?php
/* ============================================================
   TappyBird — единый бэкенд (статистика + кнопки + вход)
   Эндпоинты: ?action=track|buttons|stats|save_buttons|login|logout|me
   Хранилище: JSON-файлы в data/ (с блокировкой flock).
   ============================================================ */

require __DIR__ . '/config.php';

date_default_timezone_set('Europe/Moscow');

session_set_cookie_params([
  'lifetime' => 0,
  'path' => '/',
  'httponly' => true,
  'samesite' => 'Lax',
]);
session_start();

const STATS_FILE    = DATA_DIR . '/stats.json';
const VISITORS_FILE = DATA_DIR . '/visitors.json';
const BUTTONS_FILE  = DATA_DIR . '/buttons.json';
const MAX_BUTTONS   = 8;

/* ---------- утилиты ---------- */
function send_json($data, $code = 200) {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function body_params() {
  $raw = file_get_contents('php://input');
  $json = json_decode($raw, true);
  if (is_array($json)) return $json;
  return $_POST ?: [];
}

function client_ip() {
  foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'] as $k) {
    if (!empty($_SERVER[$k])) {
      return trim(explode(',', $_SERVER[$k])[0]);
    }
  }
  return '0.0.0.0';
}

function today() { return date('Y-m-d'); }

function read_json($file, $default) {
  if (!is_file($file)) return $default;
  $fp = @fopen($file, 'r');
  if (!$fp) return $default;
  flock($fp, LOCK_SH);
  $raw = stream_get_contents($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
  $d = json_decode($raw, true);
  return is_array($d) ? $d : $default;
}

function update_json($file, $default, $mutator) {
  $dir = dirname($file);
  if (!is_dir($dir)) @mkdir($dir, 0775, true);
  $fp = @fopen($file, 'c+');
  if (!$fp) return null;
  flock($fp, LOCK_EX);
  $raw = stream_get_contents($fp);
  $d = json_decode($raw, true);
  if (!is_array($d)) $d = $default;
  $d = $mutator($d);
  ftruncate($fp, 0);
  rewind($fp);
  fwrite($fp, json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
  return $d;
}

function default_stats() {
  return [
    'visits_total'   => 0,
    'visits_unique'  => 0,
    'views'          => ['index' => 0, 'instruction' => 0],
    'devices'        => ['pc' => 0, 'mobile' => 0],
    'time_total_sec' => 0,
    'duration'       => ['0_30' => 0, '30_120' => 0, '120_300' => 0, '300_plus' => 0],
    'clicks'         => [],
    'daily'          => [],
  ];
}

function default_buttons() {
  return ['buttons' => [
    ['id' => 'play',        'label' => 'ИГРАТЬ НА САЙТЕ',    'url' => 'https://lbgame777.xyz/3m4Fjp', 'variant' => 'primary'],
    ['id' => 'instruction', 'label' => 'ЧИТАТЬ ИНСТРУКЦИЮ', 'url' => 'instruction.html',           'variant' => 'secondary'],
  ]];
}

function is_safe_url($url) {
  $u = trim($url);
  if ($u === '') return false;
  // запрещаем потенциально опасные схемы
  if (preg_match('/^\s*(javascript|data|vbscript)\s*:/i', $u)) return false;
  return true;
}

function require_admin() {
  if (empty($_SESSION['tb_admin'])) {
    send_json(['error' => 'unauthorized'], 401);
  }
}

/* ---------- роутинг ---------- */
$action = $_GET['action'] ?? '';

switch ($action) {

  /* === трекинг события (вызывается публичными страницами) === */
  case 'track': {
    $p = array_merge($_GET, body_params());
    $event = $p['e'] ?? '';

    if ($event === 'visit') {
      $page = ($p['page'] ?? 'index') === 'instruction' ? 'instruction' : 'index';
      $device = ($p['device'] ?? 'pc') === 'mobile' ? 'mobile' : 'pc';

      // уникальность по IP+UA (всё время)
      $hash = sha1(client_ip() . '|' . ($_SERVER['HTTP_USER_AGENT'] ?? '') . '|tb-salt');
      $isUnique = false;
      update_json(VISITORS_FILE, [], function ($v) use ($hash, &$isUnique) {
        if (!isset($v[$hash])) { $v[$hash] = today(); $isUnique = true; }
        return $v;
      });

      $day = today();
      update_json(STATS_FILE, default_stats(), function ($s) use ($page, $device, $isUnique, $day) {
        $s['visits_total']++;
        if ($isUnique) $s['visits_unique']++;
        $s['views'][$page] = ($s['views'][$page] ?? 0) + 1;
        $s['devices'][$device] = ($s['devices'][$device] ?? 0) + 1;
        $s['daily'][$day] = ($s['daily'][$day] ?? 0) + 1;
        if (count($s['daily']) > 90) { // не даём расти бесконечно
          $s['daily'] = array_slice($s['daily'], -90, null, true);
        }
        return $s;
      });

    } elseif ($event === 'time') {
      update_json(STATS_FILE, default_stats(), function ($s) {
        $s['time_total_sec'] += 30;
        return $s;
      });

    } elseif ($event === 'dur') {
      $b = $p['b'] ?? '';
      if (in_array($b, ['0_30', '30_120', '120_300', '300_plus'], true)) {
        update_json(STATS_FILE, default_stats(), function ($s) use ($b) {
          $s['duration'][$b] = ($s['duration'][$b] ?? 0) + 1;
          return $s;
        });
      }

    } elseif ($event === 'click') {
      $k = preg_replace('/[^a-zA-Z0-9_]/', '', $p['k'] ?? '');
      if ($k !== '' && strlen($k) <= 40) {
        update_json(STATS_FILE, default_stats(), function ($s) use ($k) {
          $s['clicks'][$k] = ($s['clicks'][$k] ?? 0) + 1;
          return $s;
        });
      }
    }

    send_json(['ok' => true]);
  }

  /* === публичный список кнопок === */
  case 'buttons': {
    $b = read_json(BUTTONS_FILE, default_buttons());
    send_json($b);
  }

  /* === вход === */
  case 'login': {
    $p = body_params();
    if (($p['password'] ?? '') === ADMIN_PASSWORD) {
      $_SESSION['tb_admin'] = true;
      send_json(['ok' => true]);
    }
    send_json(['error' => 'wrong_password'], 401);
  }

  case 'logout': {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
      $pr = session_get_cookie_params();
      setcookie(session_name(), '', time() - 42000, $pr['path'], $pr['domain'], $pr['secure'], $pr['httponly']);
    }
    session_destroy();
    send_json(['ok' => true]);
  }

  case 'me': {
    send_json(['auth' => !empty($_SESSION['tb_admin'])]);
  }

  /* === статистика для админки (нужен вход) === */
  case 'stats': {
    require_admin();
    $s = read_json(STATS_FILE, default_stats());
    $buttons = read_json(BUTTONS_FILE, default_buttons())['buttons'];

    // подписи кликов
    $labelMap = [];
    foreach ($buttons as $b) {
      $labelMap['btn_' . $b['id']] = $b['label'];
    }
    $fixed = [
      'play_instruction' => 'Играть (страница инструкции)',
      'watch_video'      => 'Смотреть видео',
    ];
    $clicksNamed = [];
    foreach (($s['clicks'] ?? []) as $k => $v) {
      if (isset($labelMap[$k]))      $label = $labelMap[$k];
      elseif (isset($fixed[$k]))     $label = $fixed[$k];
      else                           $label = $k . ' (удалённая кнопка)';
      $clicksNamed[] = ['label' => $label, 'value' => $v];
    }

    // тренд за TREND_DAYS дней
    $trend = [];
    for ($i = TREND_DAYS - 1; $i >= 0; $i--) {
      $d = date('Y-m-d', strtotime("-$i day"));
      $trend[] = ['date' => $d, 'value' => $s['daily'][$d] ?? 0];
    }

    send_json([
      'stats'        => $s,
      'clicks_named' => $clicksNamed,
      'trend'        => $trend,
      'buttons'      => $buttons,
    ]);
  }

  /* === сохранение кнопок (нужен вход) === */
  case 'save_buttons': {
    require_admin();
    $p = body_params();
    $in = $p['buttons'] ?? [];
    if (!is_array($in)) send_json(['error' => 'bad_input'], 400);

    $clean = [];
    $usedIds = [];
    foreach ($in as $b) {
      if (count($clean) >= MAX_BUTTONS) break;
      $label = trim((string)($b['label'] ?? ''));
      $url   = trim((string)($b['url'] ?? ''));
      $variant = ($b['variant'] ?? 'primary') === 'secondary' ? 'secondary' : 'primary';
      if ($label === '' || !is_safe_url($url)) continue;
      $label = mb_substr(strip_tags($label), 0, 60);
      $url   = mb_substr($url, 0, 500);

      // id: берём существующий валидный или генерируем
      $id = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($b['id'] ?? ''));
      if ($id === '' || isset($usedIds[$id])) {
        $id = 'b' . substr(md5($label . microtime(true) . count($clean)), 0, 7);
      }
      $usedIds[$id] = true;

      $clean[] = ['id' => $id, 'label' => $label, 'url' => $url, 'variant' => $variant];
    }

    if (!$clean) send_json(['error' => 'empty'], 400);

    $saved = update_json(BUTTONS_FILE, default_buttons(), function ($cur) use ($clean) {
      return ['buttons' => $clean];
    });
    send_json($saved);
  }

  default:
    send_json(['error' => 'unknown_action'], 404);
}
