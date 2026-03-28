Mobile release prep completed for the app in `mobile/`.

Before generating a signed APK in Android Studio:

1. Create `mobile/android/key.properties` from `mobile/android/key.properties.example`.
2. Put the correct keystore password, key alias, and key password into that file.
3. Create `mobile/.env` or `mobile/.env.production` from `mobile/.env.example` if you want to override the production API URL.
4. Open `mobile/android` in Android Studio.
5. Wait for Gradle sync to finish.
6. Use `Build` > `Generate Signed Bundle / APK`.
7. Choose `APK`, then select the keystore values from `key.properties`.
8. Build the `release` variant.

Cloud/backend checks:

- Set `PUBLIC_SERVER_URL` on the backend so payment return and mock-payment links never point to localhost.
- If your backend is still served over plain HTTP on port `5000`, make sure the AWS security group allows inbound TCP `5000`.
- Confirm the server responds on:
  - `/`
  - `/api/notices`
  - `/uploads/...`

Suggested AWS verification commands:

```bash
curl http://127.0.0.1:5000/
curl http://127.0.0.1:5000/api/notices
ss -ltnp | grep 5000
printenv PUBLIC_SERVER_URL
```

If you use PM2:

```bash
pm2 status
pm2 restart all
pm2 save
```
