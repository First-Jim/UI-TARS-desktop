import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import store, { env } from './store/index.js';
import { Provider } from 'mobx-react';
// Sentry.init({
//   dsn: "https://d674932a77e6d9b9ced1190d70fd4691@o4506876178464768.ingest.us.sentry.io/4506876181151744",
//   integrations: [
//     Sentry.browserTracingIntegration(),
//     Sentry.metrics.metricsAggregatorIntegration(),
//     Sentry.reactRouterV6BrowserTracingIntegration({
//       useEffect: React.useEffect,
//     }),
//     Sentry.replayIntegration({
//       maskAllText: false,
//       blockAllMedia: false,
//     }),
//   ],
//   tracesSampleRate: 1.0,
//   tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
//   replaysSessionSampleRate: 0.1,
//   replaysOnErrorSampleRate: 1.0,
// });

const render = (Child: React.ReactNode) =>
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <BrowserRouter>
      <Provider store={store}>{Child}</Provider>
    </BrowserRouter>,
  );
env
  .init()
  .then(() => {
    console.log('✅ Environment initialized successfully');
    render(<App />);
  })
  .catch((err) => {
    console.error('❌ Environment initialization failed:', err);
    // 即使初始化失败也要渲染应用，让用户可以正常使用
    console.log('🔄 Rendering app despite initialization failure...');
    render(<App />);
  });
