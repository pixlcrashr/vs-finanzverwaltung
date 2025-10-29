import { component$ } from "@builder.io/qwik";
import Header from "~/components/layout/Header";
import HeaderButtons from "~/components/layout/HeaderButtons";
import HeaderTitle from "~/components/layout/HeaderTitle";

export default component$(() => {
  return (
    <>
      <Header>
        <HeaderTitle>Haushaltsplan erstellen</HeaderTitle>
        <HeaderButtons>
          <a class="button button is-ghost" href="/budgets">Abbrechen</a>
          <a class="button is-primary is-rounded">Erstellen</a>
        </HeaderButtons>
      </Header>

      <div class="field">
        <label class="label">Name</label>
        <div class="control">
          <input class="input" type="text" placeholder="Name"/>
        </div>
      </div>

      <div class="field">
        <label class="label">Beschreibung</label>
        <div class="control">
          <textarea
            class="textarea"
            placeholder="10 lines of textarea"
            rows="10"
          ></textarea>
          <input class="input" type="text" placeholder="Beschreibung"/>
        </div>
      </div>

      <div class="field is-horizontal">
        <div class="field-body">
          <div class="field">
            <label class="label">Start Zeitraum</label>
            <div class="control">
              <input class="input" type="text" placeholder="Start Zeitraum"/>
            </div>
          </div>

          <div class="field">
            <label class="label">Ende Zeitraum</label>
            <div class="control">
              <input class="input" type="text" placeholder="Ende Zeitraum"/>
            </div>
          </div>
        </div>
      </div>
    </>
  );
})
