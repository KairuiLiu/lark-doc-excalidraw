import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ExcalidrawDataProvider } from './contexts/ExcalidrawDataContext';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

import { messages as enMessages } from './locales/en-US/messages';
import { messages as zhMessages } from './locales/zh-CN/messages';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';

// 初始化加载默认语言
i18n.load({
  'en-US': enMessages,
  'zh-CN': zhMessages
});
i18n.activate('zh-CN');

root.render(
  <React.StrictMode>
    <I18nProvider i18n={i18n}>
      <ExcalidrawDataProvider>
        <App />
      </ExcalidrawDataProvider>
    </I18nProvider>
  </React.StrictMode>
);
