import type {
  QuestionCollection,
  Answers,
  DistinctQuestion,
} from "inquirer";

import {
  PromiseAllSequence
} from "./PromiseTypes.js";

import type {
  PartialInquirer
} from "./PartialInquirer.js";

export class FakeAnswers
{
  readonly answer: unknown
  readonly validatePass: unknown[];
  readonly validateFail: unknown[];

  constructor(
    answer: unknown,
    validatePass: unknown[] = [],
    validateFail: unknown[] = []
  )
  {
    this.answer = answer;
    this.validatePass = validatePass.slice();
    this.validateFail = validateFail.slice();
  }
}

type QuestionAndAnswer = [ string, FakeAnswers ];

export default
class FakeInquirer implements PartialInquirer
{
  #questionsQueue: QuestionAndAnswer[] = [];

  #passCount = 0;

  append(questions: QuestionAndAnswer[]) : void
  {
    this.#questionsQueue.push(...questions);
  }

  isEmpty() : boolean
  {
    return this.#questionsQueue.length === 0;
  }

  async prompt<T extends Answers = Answers>(
    questions: QuestionCollection<T>,
    initialAnswers?: Partial<T>
  ): Promise<T>
  {
    if (!FakeInquirer.#isQuestionArray<T>(questions))
      throw new Error("FakeInquirer only supports question arrays");
    const answers = {...initialAnswers};

    await PromiseAllSequence(
      questions,
      async question => this.#askQuestion(question, answers as T)
    );

    return answers as T;
  }

  static #isQuestionArray<
    T extends Answers = Answers
  >
  (
    questions: QuestionCollection<T>
  ) : questions is DistinctQuestion<T>[]
  {
    return Array.isArray(questions);
  }

  async #askQuestion<
    T extends Answers = Answers
  >
  (
    question: DistinctQuestion<T>,
    answers: T
  ) : Promise<void>
  {
    if (!question.name)
      throw new Error("No name for a question... help!");

    const { name } = question;
    if ((name in answers) && !(question as { askAnswered: boolean }).askAnswered)
      return;

    if (this.#questionsQueue.length === 0) {
      throw new Error(`No fake answers for question "${name}" at index ${this.#passCount}!`);
    }

    const [expectedNextName, fakeAnswers] = this.#questionsQueue[0];
    if (name !== expectedNextName)
      throw new Error(`expected question "${expectedNextName}", received "${name}" at index ${this.#passCount}`);

    if (!fakeAnswers)
      throw new Error(`No fake answers for question "${name}" at index ${this.#passCount}!`);
    this.#questionsQueue.shift();

    if (question.validate) {
      await PromiseAllSequence(fakeAnswers.validateFail, async answer => {
        await this.#validateAnswer(question, name, answer, answers, false, false);
      });

      await PromiseAllSequence(fakeAnswers.validatePass, async answer => {
        await this.#validateAnswer(question, name, answer, answers, true, false);
      });

      await this.#validateAnswer(
        question, name, fakeAnswers.answer, answers, true, true
      );
    }
    else if (
      fakeAnswers.validateFail.length ||
      fakeAnswers.validatePass.length
    )
    {
      throw new Error(`Validation test answers are present for a question with no validate method: "${name}" at index ${this.#passCount}`);
    }

    answers[name] = fakeAnswers.answer as T[string];
    this.#passCount++;
  }

  async #validateAnswer<
    T extends Answers = Answers
  >
  (
    question : DistinctQuestion<T>,
    name: string,
    answer: unknown,
    answers: T,
    shouldPass: boolean,
    isFinal: boolean
  ) : Promise<void>
  {
    if (!question.validate)
      throw new Error("assertion failure, we shouldn't get here");

    const result = await question.validate(answer, answers);
    if ((result === true) === shouldPass)
      return;

    throw new Error(
      `validation should have ${
        shouldPass ? "passed" : "failed"
      } on question "${name}" with ${
        isFinal ? "final " : ""
      }answer "${String(answer)}" at index ${this.#passCount}`
    );
  }
}
