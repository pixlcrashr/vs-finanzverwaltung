import { component$, QRL, Signal } from "@builder.io/qwik";
import { formAction$, reset, useForm, valiForm$ } from "@modular-forms/qwik";
import * as v from 'valibot';
import { Prisma } from "~/lib/prisma";



const CreateAccountSchema = v.object({
  name: v.pipe(
    v.string(),
    v.minLength(1)
  ),
  code: v.pipe(
    v.string(),
    v.minLength(1)
  ),
  description: v.string(),
  parentAccountId: v.pipe(
    v.nullable(v.string())
  )
});

type CreateAccountForm = v.InferInput<typeof CreateAccountSchema>;

export interface Account {
  id: string;
  code: string;
  name: string;
  depth: number;
}

type CreateAccountFormProps = {
  onCreated$?: QRL<() => void>;
  accounts: Signal<Account[]>;
}

async function createAccount(parentAccountId: string | null, name: string, code: string, description: string): Promise<void> {
  await Prisma.accounts.create({
    data: {
      parent_account_id: parentAccountId,
      display_name: name,
      display_code: code,
      display_description: description
    }
  });
}

export const useFormAction = formAction$<CreateAccountForm>(async (values) => {
  await createAccount(
    values.parentAccountId,
    values.name,
    values.code,
    values.description
  );

  return {
    status: "success"
  }
}, valiForm$(CreateAccountSchema));



export default component$<CreateAccountFormProps>((compProps) => {
  const [form, { Form, Field }] = useForm({
    loader: { value: {
      name: '',
      description: '',
      code: '',
      parentAccountId: null
    }},
    action: useFormAction(),
  });


  return (
    <>
      <Form onSubmit$={() => { reset(form); compProps.onCreated$?.(); }}>
        <div class="field">
          <label class="label">Übergeordnetes Konto</label>
          <Field name="parentAccountId">
            {(field, props) => (<>
              <div class="select">
                <select {...props} disabled={form.submitting} value={field.value ?? ''}>
                  <option value="">Kein übergeordnetes Konto</option>
                  {compProps.accounts.value.map((account) => (
                    <option key={account.id} value={account.id}>
                      {`${"\u00A0".repeat(account.depth * 5)}└─ ${account.code} | ${account.name}`}
                    </option>
                  ))}
                </select>
              </div>

              {field.error && <p class="help is-danger">{field.error}</p>}
            </>)}
          </Field>
        </div>

        <div class="field">
          <label class="label">Code</label>
          <Field name="code">
            {(field, props) => (<>
              <div class="control">
                <input {...props} class="input is-small" disabled={form.submitting} type="text" value={field.value} />
              </div>

              {field.error && <p class="help is-danger">{field.error}</p>}
            </>)}
          </Field>
        </div>

        <div class="field">
          <label class="label">Name</label>
          <Field name="name">
            {(field, props) => (<>
              <div class="control">
                <input {...props} class="input is-small" disabled={form.submitting} type="text" value={field.value} />
              </div>

              {field.error && <p class="help is-danger">{field.error}</p>}
            </>)}
          </Field>
        </div>

        <div class="field">
          <label class="label">Beschreibung</label>
          <Field name="description">
            {(field, props) => (<>
              <div class="control">
                <textarea {...props} class="textarea is-small" disabled={form.submitting} rows={10} value={field.value} />
              </div>

              {field.error && <p class="help is-danger">{field.error}</p>}
            </>)}
          </Field>
        </div>

        <div class="buttons mt-5 is-right are-small">
          <button type="submit" class={["button", "is-primary", {
            'is-loading': form.submitting
          }]}>Hinzufügen</button>
        </div>
      </Form>
    </>
  );
});
