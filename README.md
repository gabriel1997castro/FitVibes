# FitVibes Project Structure

This project follows the folder structure and conventions described in `docs/Context.MD` and `docs/DevelopmentPlan.md`, using `src/` as the main source directory for all application code, features, and components.

**State management is handled with [Zustand](https://zustand-demo.pmnd.rs/), not Redux. The `store.ts` and `store/` folder are for Zustand stores.**

# Expo Router Example

Use [`expo-router`](https://docs.expo.dev/router/introduction/) to build native navigation using files in the `app/` directory.

## 🚀 How to use

```sh
npx create-expo-app -e with-router
```

## Deploy

Deploy on all platforms with Expo Application Services (EAS).

- Deploy the website: `npx eas-cli deploy` — [Learn more](https://docs.expo.dev/eas/hosting/get-started/)
- Deploy on iOS and Android using: `npx eas-cli build` — [Learn more](https://expo.dev/eas)

## 📝 Notes

- [Expo Router: Docs](https://docs.expo.dev/router/introduction/)
