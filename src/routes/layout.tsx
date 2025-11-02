import { component$, Slot } from "@builder.io/qwik";
import MainLayout from "~/components/layout/MainLayout";

export default component$(() => {
  return (
    <>
      <MainLayout>
        <Slot />
      </MainLayout>
    </>
  );
});
