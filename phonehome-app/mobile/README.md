# Phone Home — apps Android e iOS

O app das lojas é uma "casca" nativa (Capacitor) que abre o site `phonehome-app.vercel.app`.
Toda melhoria no site chega nos celulares sem publicar nova versão na loja.
As pastas `android/` e `ios/` são geradas automaticamente (não ficam no Git).

## Android (Google Play)
1. GitHub → aba **Actions** → **Android (Play Store)** → **Run workflow**.
2. No fim, baixe o artefato `phonehome-android-aab-loja-assinado-true` (arquivo `.aab` para a Play Console)
   e `phonehome-android-apk-teste` (APK para instalar direto num celular e testar).
3. Para o `.aab` sair assinado, cadastre em Settings → Secrets and variables → Actions:
   `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
   Guarde a chave (`.jks`) em local seguro: sem ela não dá para atualizar o app depois.

## iOS (App Store) — precisa de um Mac com Xcode e conta Apple Developer (US$ 99/ano)
1. O workflow **iOS (App Store)** confirma que o projeto compila.
2. No Mac: `cd phonehome-app/mobile && npm install && npm run ios:add && npx cap open ios`.
3. No Xcode: selecione o alvo **App** → *Signing & Capabilities* → escolha seu Team →
   *Product → Archive* → *Distribute App → App Store Connect*.

## Domínio próprio
Quando existir `app.iphonehome.com.br`, troque `server.url` em `capacitor.config.json`.

## Observações
- Login com Google fica oculto dentro do app (o Google bloqueia login em WebView e a Apple exige
  "Entrar com Apple" quando há login social). Dentro do app: e-mail e senha.
- Notificações push: o plugin já está incluído, mas falta configurar Firebase (Android) e APNs (iOS).
