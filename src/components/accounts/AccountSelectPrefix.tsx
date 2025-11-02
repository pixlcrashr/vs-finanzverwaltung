import { component$, Slot } from "@builder.io/qwik";

type AccountSelectPrefixProps = {
  depth: number;
}

export default component$<AccountSelectPrefixProps>((props) => {
  return (
    <>
      <span>{new Array(props.depth * 5).fill(0).map(() => <>&nbsp;</>)}└─&nbsp;</span>
      <Slot />
    </>
  );
});
