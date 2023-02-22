# extract-locale

使用 babel 自动收集未翻译的文案 并替换为 formatMessage

源文件

```jsx
const App = (user) => {
  return (
    <div>
      <div>用户名: {user.name}</div>
      <div>地址: {user.adderss}</div>
    </div>
  );
};
```

执行该命令

```bash
extract-locale ./src/**/*.{ts,tsx}
```

编译后的文件

```jsx
import { useIntl } from "xxx/IntlProvider";

const App = (user) => {
  const intl = useIntl();
  return (
    <div>
      <div>
        {intl.formatMessage("@LOCALE_TEXT_0")} {user.name}
      </div>
      <div>
        {intl.formatMessage("@LOCALE_TEXT_0")} {user.adderss}
      </div>
    </div>
  );
};
```

对应的文案

```json
{
  "@LOCALE_TEXT_0": "用户名:",
  "@LOCALE_TEXT_1": "地址:"
}
```

### 参数

主要参数为 文件匹配符

| 参数              | 缩写 | 描述                              |
| ----------------- | ---- | --------------------------------- |
| --locale <locale> | -l   | 输入已存在的 localemap            |
| --prefix <prefix> | -p   | 国际化文案的前缀(`@LOCALE_TEXT_`) |
| --offset <offset> | -o   | 起始序号(`0`)                     |
| --no-auto         | -A   | 是否禁止自动替换(`false`)         |
