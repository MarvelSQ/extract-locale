import React, { useMemo } from "react";

function Home({ name, children }: React.PropsWithChildren<{ name: string }>) {
  const content = useMemo(() => {
    return `主页 - ${name}`;
  }, [name]);

  return (
    <div>
      <div>{content}</div>
      <div>{children}</div>
    </div>
  );
}

export default Home;
