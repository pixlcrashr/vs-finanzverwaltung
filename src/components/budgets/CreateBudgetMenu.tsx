import { component$, isBrowser, type QRL } from "@builder.io/qwik";
import type { SubmitHandler } from '@modular-forms/qwik';
import { formAction$, useForm, valiForm$ } from "@modular-forms/qwik";
import * as v from 'valibot';
import { Prisma } from "~/lib/prisma";



const CreateBudgetSchema = v.object({
  name: v.pipe(
    v.string(),
    v.minLength(1)
  ),
  description: v.string(),
  startDate: v.pipe(
    v.string(),
    v.isoDate()
  ),
  endDate: v.pipe(
    v.string(),
    v.isoDate()
  )
});

type CreateBudgetForm = v.InferInput<typeof CreateBudgetSchema>;

interface CreateBudgetMenuFormProps {
  onCreated$?: QRL<SubmitHandler<CreateBudgetForm>>;
};

async function createBudget(name: string, description: string, startDate: Date, endDate: Date): Promise<void> {
  await Prisma.budgets.create({
    data: {
      display_name: name,
      display_description: description,
      period_start: startDate,
      period_end: endDate,
      budget_revisions: {
        create: {
          date: startDate,
        }
      }
    }
  });
}

export const useFormAction = formAction$<CreateBudgetForm>(async (values) => {
  await createBudget(values.name, values.description, new Date(values.startDate), new Date(values.endDate));
}, valiForm$(CreateBudgetSchema));

export default component$((props) => {
  /*const [form, { Form, Field }] = useForm<CreateBudgetForm>({
    loader: { value: {
      name: '',
      description: '',
      startDate: '',
      endDate: ''
    }},
    action: useFormAction(),
    validate: valiForm$(CreateBudgetSchema)
  });*/

  return (
    <p>test</p>
  );
});
