# POS Mini Cafe Frontend

Frontend Angular cho POS Mini Cafe.

## Yeu cau

- Node.js >= 20.19.0
- npm
- Backend local chay tai `http://localhost:3000`

## Cai dat lan dau

```powershell
npm install
```

## Code local

Chay frontend voi hot reload:

```powershell
npm run dev
```

Mo trinh duyet tai:

```text
http://localhost:4200
```

Trong local dev, frontend goi API bang `/api`. File `proxy.conf.json` se proxy cac request nay sang backend local:

```text
http://localhost:3000/api
```

Neu muon test tren dien thoai hoac may khac cung mang LAN:

```powershell
npm run dev:lan
```

Sau do mo:

```text
http://<ip-may-cua-ban>:4200
```

## Preview ban production tren local

`npm start` chi dung de serve ban da build trong `dist`, khong co hot reload.

```powershell
npm run preview
```

Hoac tach rieng:

```powershell
npm run build
npm start
```

Mac dinh production server chay tai:

```text
http://localhost:8080
```

## Lenh hay dung

```powershell
npm run dev      # code local, hot reload
npm run dev:lan  # code local, cho may khac trong LAN truy cap
npm run build    # build production
npm run preview  # build va serve production local
npm test         # chay unit test headless
```
