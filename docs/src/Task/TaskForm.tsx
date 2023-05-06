import { Button, Form, Input, Space } from "antd";
import { useMemo, useState } from "react";
import ReactIntlLogo from "../../public/react-intl.svg";
import Select from "../components/Select";
import { PlusOutlined } from "@ant-design/icons";

function TaskForm() {
  const [inputName, setInputName] = useState("");

  const localeTypes = useMemo(() => {
    return [
      {
        label: "🇨🇳 Chinese",
        value: "[\\u4e00-\\u9fa5]",
      },
    ];
  }, []);

  const processTypes = useMemo(() => {
    return [
      {
        label: (
          <>
            <img src={ReactIntlLogo} width={16} /> react-intl useIntl
          </>
        ),
        value: "react-intl.useIntl",
      },
      {
        label: (
          <>
            <img src={ReactIntlLogo} width={16} /> react-intl Imperative API
          </>
        ),
        value: "react-intl.imperativeAPI",
      },
      {
        label: (
          <>
            <img src={ReactIntlLogo} width={16} /> react-intl{" "}
            {"<FormattedMessage />"}
          </>
        ),
        value: "react-intl.FormattedMessage",
      },
    ];
  }, []);

  return (
    <Form
      name="basic"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      initialValues={{
        "locale.match": "[\\u4e00-\\u9fa5]",
        "localeKey.pattern": "LOCALE_KEY_{number}",
        processTypes: ["react-intl.useIntl", "react-intl.imperativeAPI"],
      }}
    >
      <Form.Item name="locale.match" label="Locale Match">
        <Select
          options={localeTypes}
          renderFooter={({ onChange }) => (
            <Space style={{ padding: "0 8px 4px" }}>
              <Input
                style={{
                  width: 280,
                }}
                placeholder="Please enter locale RegExp"
                value={inputName}
                onChange={(event) => setInputName(event.target.value)}
              />
              <Button
                disabled={!inputName}
                type="text"
                icon={<PlusOutlined />}
                onClick={() => {
                  if (!inputName) return;
                  onChange(inputName);
                  setInputName("");
                }}
              >
                Select
              </Button>
            </Space>
          )}
        />
      </Form.Item>
      <Form.Item
        name="localeKey.pattern"
        label="Locale Naming Pattern"
        extra={
          <>
            Template variables:
            <ul>
              <li>
                <code>{"{number}"}</code> - auto increment number
              </li>
            </ul>
          </>
        }
      >
        <Input />
      </Form.Item>
      <Form.Item name="processTypes" label="Process Types">
        <Select mode="multiple" size="large" options={processTypes} />
      </Form.Item>
    </Form>
  );
}

export default TaskForm;
