# MIRED360 Beauty — Android

La app comercial para barberías se sirve desde:
https://yesid1000415.github.io/MIRED360-BEAUTY/

## Arquitectura Android recomendada
Para Google Play se utilizará una Trusted Web Activity (TWA), de modo que la app Android abra la PWA instalada en pantalla completa y conserve Supabase, pagos y actualizaciones web sin duplicar la lógica.

- App: MIRED360 Beauty
- Package sugerido: com.mired360.beauty
- Start URL: https://yesid1000415.github.io/MIRED360-BEAUTY/
- Scope: https://yesid1000415.github.io/MIRED360-BEAUTY/
- Display: standalone
- Orientación: portrait
- Administrador General: NO incluido en la app comercial.

## Antes de publicar en Play
1. Generar proyecto TWA/Android con el package definitivo.
2. Crear keystore de firma y conservarlo de forma privada.
3. Obtener SHA-256 del certificado de firma.
4. Publicar /.well-known/assetlinks.json en un dominio propio o usar el mecanismo compatible con el host elegido.
5. Compilar AAB firmado para Google Play y APK firmado para instalación directa.
6. Probar autenticación OTP, cámara/archivos si se agregan, pagos Bold, navegación y cierre de sesión en Android.

No guardar keystores, contraseñas ni secretos de Supabase/Bold en este repositorio.
