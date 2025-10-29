import { component$, Slot } from "@builder.io/qwik";
import Content from "~/components/layout/Content";
import Navbar from "~/components/layout/Navbar";

export default component$(() => {
  return (
    <>
      <Navbar />
      <Content>
        <Slot />
      </Content>
    </>
  );
})
