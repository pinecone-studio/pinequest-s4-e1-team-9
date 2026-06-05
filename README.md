# pinequest-s4-e1-team-9

AI PDF chatbot төсөл. Энэ repo нь Bun workspace ашигладаг monorepo бөгөөд `backend` болон `frontend` гэсэн хоёр хэсэгтэй.

## Шаардлага

- Bun `1.3.14` эсвэл түүнээс дээш
- Node.js `20.16.0` - `24.x`

## Эхлүүлэх command-ууд

Dependency install хийх:

```bash
bun install
```

Бүх project build шалгах:

```bash
bun run build
```

Бүх workspace-ийг development mode-оор ажиллуулах:

```bash
bun run dev
```

Зөвхөн backend LangGraph server ажиллуулах:

```bash
bun run --cwd backend langgraph:dev
```

Зөвхөн frontend Next.js server ажиллуулах:

```bash
bun run --cwd frontend dev
```

## Milestone 0 шалгах

Milestone 0 дууссан гэж үзэхийн тулд:

- `bun install` амжилттай дууссан байх
- `bun run build` dependency missing error-гүй амжилттай дууссан байх
- Багийн гишүүд бүгд дээрх ижил command-уудыг ашигладаг байх
