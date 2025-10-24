
# Surechigai — フロントエンド連携ガイド

このドキュメントは、このリポジトリのバックエンドとフロントエンドを連携するための手順を日本語でまとめたものです。認証（特に Google サインイン／サインアップ）に重点を置き、主要な API の使い方や注意点を記載しています。

フロントエンド（Web / モバイル）でこのバックエンドと連携する際は以下を参照してください。

## 概要

- 公開ルート: `/public/*`（認証不要）
- 認証関連: `/auth/*` — `POST /auth/signup` と `POST /auth/signin` は認証不要で呼べます。`PUT /auth/update` と `GET /auth/me` はアクセストークンが必要です。
- データ: `/data/*` — 基本的に認証が必要です（ただし `/public` は除く）。

認証の仕組み
- アクセストークン: 短寿命の JWT（`accessToken`）。API 呼び出し時に Authorization ヘッダへ付与します。
- リフレッシュトークン: 長寿命のトークン（`refreshToken`）。現在の実装はサインアップ／サインイン時に JSON レスポンスで返します（サーバ側でも保存しています）。

重要な注意点
- バックエンドは Google の `id_token` を検証する実装を持っています。フロントエンドは Google Sign-In（あるいは One Tap 等）で得た `id_token` をバックエンドに渡してください。
- サーバは Google の tokeninfo エンドポイントを使って `id_token` を検証します。サーバ環境変数 `GOOGLE_CLIENT_ID` が設定されている場合は `aud` チェックも行い、`email_verified` が利用可能ならそれが真であることを要求します。

## 環境（ローカル／開発）

- バックエンドが参照する主な環境変数:
  - `DATABASE_URL` または Postgres の接続情報（`src/db/client.ts` を参照）
  - `JWT_SECRET` — JWT の署名に使うシークレット
  - `GOOGLE_CLIENT_ID` — （推奨）Google クライアントID（`aud` 検証に使用）
  - `PORT` — 任意

## トークンの取り扱い（フロントエンド向け推奨）

- アクセストークン（`accessToken`）: メモリや短時間だけ保持するストレージに入れるのが望ましいです。可能な限りロングタームの JS からアクセスできる場所（localStorage 等）に置くことは避けてください。
- リフレッシュトークン（`refreshToken`）: セキュリティ面では httpOnly cookie にセットするのが最も安全です。このリポジトリは現状 JSON で返していますが、より安全にするならバックエンド側で httpOnly, Secure なクッキーへ設定する実装に変更してください。
- 保護された API へは必ずヘッダ `Authorization: Bearer <accessToken>` を付与してください。

## 認証フロー（フロントエンド実装手順）

1) Google サインアップ（新規ユーザ）

  - フロントエンドで Google Sign-In を行い、`id_token` を取得します。
  - サーバへ以下を POST します: `POST /auth/signup`

    {
      "provider": "google",
      "token": "<GOOGLE_ID_TOKEN>",
      "name": "<表示名>",
      "icon": "https://.../avatar.png",
      "github": "任意",
      "x": "任意",
      "mail": "任意"
    }

  - サーバは `id_token` を検証し、トークンの `sub` を `provider_account_id` として内部で扱います。成功すると `201 { user, tokens }` を返します。`user` には割り当てられた `major/minor`（iBeacon）などのプロフィールが含まれます。

2) Google サインイン（既存ユーザ）

  - フロントエンドで `id_token` を取得します。
  - サーバへ `POST /auth/signin` を実行（ボディは `provider` と `token`）。
  - サーバがトークンを検証して OAuth レコードを検索し、該当があれば `{ user, tokens }` を返します。

3) 保護付き API の利用

  - リクエストヘッダに `Authorization: Bearer <accessToken>` を付与して呼び出します。
  - 本サーバは `/public/*` と POST `/auth/signup`, POST `/auth/signin` を除いて認証を要求します。

4) リフレッシュトークンについて

  - このプロジェクトではリフレッシュトークンを DB に保存していますが、フロントエンド側での自動更新用に `/auth/refresh` エンドポイントを用意する形は不要です（運用方針に合わせ、必要なら将来検討してください）。

## API リファレンス（概要）

すべて JSON を使った入出力を想定しています。

認証（Auth）

- POST /auth/signup
  - 説明: OAuth プロバイダでユーザを登録、既存アカウントがあればそれを返す
  - Body: AuthSignupRequest
    - provider: string（例: "google"）
    - token: string（Google の場合は id_token）
    - name: string
    - icon: string (URL)
    - github, x, mail: 任意
  - Response: 201 AuthResponse { user, tokens }

- POST /auth/signin
  - 説明: OAuth トークンでログイン
  - Body: AuthSigninRequest { provider, token }
  - Response: 200 AuthResponse { user, tokens }

- PUT /auth/update
  - 認証必須
  - Body: AuthUpdateRequest (icon, name, github, x, mail の任意フィールド)
  - Response: 200 AuthResponse { user, tokens }

- GET /auth/me
  - 認証必須
  - Response: 200 UserProfile（現在のユーザ情報、major/minor を含む）

データ（Data）

- POST /data/encount
  - 認証必須
  - Body: EncountCreateRequest { message?: string }
  - Response: 201 EncountResponse（作成したメッセージと投稿者プロフィール）

- GET /data/encount/me
  - 認証必須
  - Response: 200 [EncountResponse]（互換性のため配列で返す実装になっています）

公開（Public）

- GET /public/data/encount
  - 認証不要
  - ボディ: 現在は JSON ボディ（配列）を受け取る設計になっています。各要素は `EncountKey`（major, minor, timestamp）です。
  - 振る舞い: 各 key に対して、その `timestamp` より前の最新メッセージを返します（strictly before）。
  - Response: 200 EncountResponse[]

レスポンスの形（重要項目）

- EncountKey: { major: number, minor: number, timestamp: string }
- EncountResponse: {
  id: string,
  userId: string,
  createAt: string,
  deleteAt?: string | undefined,
  name: string,
  icon: string,
  x?: string,
  github?: string,
  mail?: string,
  message?: string
}

エラー処理

- バリデーションや認可の失敗は 4xx を返します。サーバ内部の問題は 5xx を返します。
- Zod によるバリデーション失敗は 400 として詳細が返ります。

フロントエンド用サンプル（curl 簡易例）

- Google サインアップ例:

  curl -X POST https://api.example.com/auth/signup \
    -H "Content-Type: application/json" \
    -d '{
      "provider":"google",
      "token":"<ID_TOKEN>",
      "name":"Alice",
      "icon":"https://example.com/a.png"
    }'

- 保護付きエンドポイント呼び出し例:

  curl -X POST https://api.example.com/data/encount \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <ACCESS_TOKEN>" \
    -d '{ "message": "hello" }'

- 公開 encount クエリ（GET + JSON body の実装）:

  curl -X GET https://api.example.com/public/data/encount \
    -H "Content-Type: application/json" \
    -d '[{ "major": 2, "minor": 5, "timestamp": "2025-10-24T12:00:00Z" }]'

セキュリティ上の推奨

- 本番では HTTPS を必ず使用してください。
- リフレッシュトークンは可能であれば httpOnly かつ Secure なクッキーで扱うのが望ましいです（現状は JSON で返却しています）。
- Google の `id_token` を検証する際は `aud`（クライアントID）をサーバ側でチェックしてください（このプロジェクトは `GOOGLE_CLIENT_ID` によるチェックをサポートしています）。

備考・TODO（実装上の注記）

- 現状、バックエンドはリフレッシュトークンを JSON で返す実装になっています。セキュアに運用する場合は、httpOnly cookie に切り替えることを検討してください。ただし `/auth/refresh` エンドポイントはこのプロジェクトでは不要とのことなので、現状は実装していません。
- `/public/data/encount` は GET で JSON ボディを受け取る特異な実装です。クライアント実装側で GET ボディを送れる環境か確認してください。必要なら POST に変更するのも検討可能です。

さらに詳しい情報が必要な場合

DB スキーマは `db/create_tables.sql`、コードは `src/` 以下（routes, controllers, db helpers）を参照してください。フロント側サンプル（React + Google Sign-in）を追加して欲しい場合は実装できますのでお知らせください。

---
このファイルはリポジトリのドキュメントとして生成されました。認証仕様やトークン周りを変更した場合はこの README を更新してください。

## Flutter 実装例

以下は Flutter（Dart）で Google サインインを行い、バックエンドの `POST /auth/signup` に `id_token` を送ってサインアップ／サインインする最小の例です。実運用ではエラーハンドリングや UI の整備、HTTPS の利用、トークン保護（`flutter_secure_storage` など）を行ってください。

pubspec.yaml に追加する依存（例）:

```yaml
dependencies:
  flutter:
    sdk: flutter
  google_sign_in: ^6.0.0
  http: ^0.13.0
  flutter_secure_storage: ^8.0.0
```

サンプルコード（簡易）:

```dart
import 'dart:convert';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final GoogleSignIn _googleSignIn = GoogleSignIn(
  scopes: ['email', 'profile'],
);
final _storage = FlutterSecureStorage();

Future<void> signUpWithGoogle() async {
  // ユーザが Google アカウントを選んでサインイン
  final account = await _googleSignIn.signIn();
  if (account == null) {
    // ユーザがキャンセル
    return;
  }
  final auth = await account.authentication;
  final idToken = auth.idToken; // これをバックエンドへ送る
  if (idToken == null) throw Exception('No idToken from Google');

  final body = jsonEncode({
    'provider': 'google',
    'token': idToken,
    'name': account.displayName ?? '',
    'icon': account.photoUrl ?? '',
  });

  final res = await http.post(
    Uri.parse('https://api.example.com/auth/signup'),
    headers: {'Content-Type': 'application/json'},
    body: body,
  );

  if (res.statusCode != 201 && res.statusCode != 200) {
    throw Exception('Signup failed: ${res.statusCode} ${res.body}');
  }

  final data = jsonDecode(res.body) as Map<String, dynamic>;
  final tokens = data['tokens'] as Map<String, dynamic>;
  final accessToken = tokens['accessToken'] as String;
  final refreshToken = tokens['refreshToken'] as String;

  // accessToken はメモリに保持し、refreshToken はセキュアストレージへ
  await _storage.write(key: 'refreshToken', value: refreshToken);
  // accessToken をアプリ状態に保存する実装は各自で行ってください
}

// 保護された API を呼ぶ例
Future<void> postEncount(String accessToken, String message) async {
  final res = await http.post(
    Uri.parse('https://api.example.com/data/encount'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $accessToken',
    },
    body: jsonEncode({'message': message}),
  );
  if (res.statusCode != 201) {
    throw Exception('Failed to post: ${res.statusCode}');
  }
}

// 公開エンドポイント（ビーコン -> メッセージ検索）の呼び出し例
Future<void> queryPublicEncount() async {
  final body = jsonEncode([
    {
      'major': 2,
      'minor': 5,
      'timestamp': DateTime.now().toUtc().toIso8601String(),
    }
  ]);
  final res = await http.get(
    Uri.parse('https://api.example.com/public/data/encount'),
    headers: {'Content-Type': 'application/json'},
    // http.get の body を直接渡せないクライアントもあるため、
    // 必要なら POST に変更してサーバ/クライアント両方で合わせてください。
  );
  // 上の実装は GET で body を送る例ですが、Dart の http.get は body を受け付けないため
  // 実運用では POST に切り替えることを強く推奨します。
  // 代替（POST をサーバ側で受け付ける場合）:
  // final res = await http.post(Uri.parse('https://api.example.com/public/data/encount'), headers: {'Content-Type':'application/json'}, body: body);
}
```

補足
- 上の実装例は最小限の流れを示したもので、エラー処理やトークンの自動更新、UI ローディング状態などは省略しています。
- `flutter_secure_storage` を使ってリフレッシュトークンを安全に保存し、アクセストークンが失効したらリフレッシュ（本プロジェクトでは `/auth/refresh` は不要なので、リフレッシュトークンを使った自動更新は環境に合わせて検討してください）。

---


