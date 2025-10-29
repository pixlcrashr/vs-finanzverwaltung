import { component$, Slot } from "@builder.io/qwik";
import Content from "~/components/layout/Content";

export default component$(() => {
  return (
    <>
      <Content>
        <Slot />
      </Content>
    </>
  );
})
