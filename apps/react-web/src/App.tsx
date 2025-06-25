import AppRouter from '@/router';
import * as Sentry from '@sentry/react';

const App = () => {
  return (
    <main className="bg-white">
      <AppRouter />
    </main>
  );
};

export default App;
