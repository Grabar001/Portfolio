<?php
/**
 * Contact form handler for albert-grabar.com (PlanetHoster, PHP 8+).
 * Validates the request, blocks simple bots, sends one plain-text email
 * and redirects to the thank-you page. Nothing is stored on the server.
 * Values in __DOUBLE_UNDERSCORES__ are filled in by build.mjs from site.config.json.
 */
declare(strict_types=1);

const TO_EMAIL = '__TO_EMAIL__';
const CONSUMERS = __CONSUMERS__; // false = professionals only (company and "pro" box required)
const FROM_EMAIL = '__FROM_EMAIL__';
const SITE_NAME = 'albert-grabar.com';
const MAX_PER_HOUR = 5;
const MIN_SECONDS = 3;
const NEEDS = ['audit', 'launch', 'site', 'fixes', 'other'];
const CLIENTS = ['particulier' => 'Particulier', 'professionnel' => 'Professionnel'];
const BUDGETS = ['0', '1', '2', '3'];
const BUDGET_LABELS = ['< 300 €', '300–600 €', '600–1 500 €', '> 1 500 €'];

$lang = in_array($_POST['lang'] ?? '', ['en', 'ru'], true) ? $_POST['lang'] : 'fr';
$okUrl = $lang === 'fr' ? 'merci.html' : $lang . '/thanks.html';
$errorUrl = $lang === 'fr' ? 'contact.html?error=1#form' : $lang . '/contact.html?error=1#form';

function go(string $path): never
{
    $base = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/'), '/');
    header('Location: ' . $base . '/' . $path, true, 303);
    exit;
}

/** One-line field: trimmed, no line breaks (blocks header injection), length-limited. */
function line(string $key, int $max): string
{
    $value = trim((string)($_POST[$key] ?? ''));
    $value = preg_replace('/[\r\n\t]+/', ' ', $value) ?? '';
    return mb_substr($value, 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    go($errorUrl);
}

// Honeypot: people never see this field, bots fill it. Pretend it worked.
if (trim((string)($_POST['website'] ?? '')) !== '') {
    go($okUrl);
}

// Time trap: a human needs more than a few seconds to fill the form.
$started = (int)($_POST['started'] ?? 0);
if ($started > 0 && (time() - $started) < MIN_SECONDS) {
    go($okUrl);
}

$name = line('name', 120);
$email = line('email', 160);
$client = line('client', 20);
$company = line('company', 200);
$pro = ($_POST['pro'] ?? '') === 'yes';
if (!CONSUMERS) {
    $client = 'professionnel';
}
$need = line('need', 20);
$link = line('link', 300);
$budget = line('budget', 2);
$deadline = line('deadline', 120);
$message = trim((string)($_POST['message'] ?? ''));
$message = mb_substr(str_replace("\r\n", "\n", $message), 0, 4000);

$valid = $name !== ''
    && filter_var($email, FILTER_VALIDATE_EMAIL) !== false
    && array_key_exists($client, CLIENTS)
    && (CONSUMERS || ($pro && $company !== ''))
    && in_array($need, NEEDS, true)
    && mb_strlen($message) >= 10
    && ($budget === '' || in_array($budget, BUDGETS, true))
    && ($link === '' || filter_var($link, FILTER_VALIDATE_URL) !== false);

if (!$valid) {
    go($errorUrl);
}

// Rate limit: at most MAX_PER_HOUR messages per visitor per hour (hashed IP, temp file).
$bucket = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . '|' . date('Y-m-d-H'));
$counterFile = sys_get_temp_dir() . '/ag_contact_' . substr($bucket, 0, 24);
foreach (glob(sys_get_temp_dir() . '/ag_contact_*') ?: [] as $oldFile) {
    if (filemtime($oldFile) < time() - 7200) {
        @unlink($oldFile);
    }
}
$count = is_file($counterFile) ? (int)file_get_contents($counterFile) : 0;
if ($count >= MAX_PER_HOUR) {
    go($errorUrl);
}
file_put_contents($counterFile, (string)($count + 1), LOCK_EX);

$budgetLabel = $budget === '' ? '—' : BUDGET_LABELS[(int)$budget];
$subject = sprintf('[%s] %s — %s', SITE_NAME, $need, $name);
$body = implode("\n", [
    'Nouvelle demande depuis ' . SITE_NAME . ' (' . strtoupper($lang) . ')',
    '',
    'Nom : ' . $name,
    'E-mail : ' . $email,
    'Client : ' . CLIENTS[$client],
    'Entreprise / SIRET : ' . ($company !== '' ? $company : '—'),
    'Besoin : ' . $need,
    'Lien : ' . ($link !== '' ? $link : '—'),
    'Budget : ' . $budgetLabel,
    'Délai : ' . ($deadline !== '' ? $deadline : '—'),
    '',
    'Projet :',
    $message,
    '',
    '— Envoyé le ' . date('Y-m-d H:i'),
]);

$headers = [
    'From' => SITE_NAME . ' <' . FROM_EMAIL . '>',
    'Reply-To' => $email,
    'Content-Type' => 'text/plain; charset=UTF-8',
    'MIME-Version' => '1.0',
];

// "-f" sets the envelope sender to the site's own domain (better delivery to Gmail).
// Some hosts refuse it: then the message is sent again without it.
$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$sent = mail(TO_EMAIL, $encodedSubject, $body, $headers, '-f' . FROM_EMAIL)
    || mail(TO_EMAIL, $encodedSubject, $body, $headers);

go($sent ? $okUrl : $errorUrl);
