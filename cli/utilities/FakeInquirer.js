import { PromiseAllSequence } from "./PromiseTypes.js";
export class FakeAnswers {
    answer;
    validatePass;
    validateFail;
    constructor(answer, validatePass = [], validateFail = []) {
        this.answer = answer;
        this.validatePass = validatePass.slice();
        this.validateFail = validateFail.slice();
    }
}
export default class FakeInquirer {
    #questionsQueue = [];
    #passCount = 0;
    append(questions) {
        this.#questionsQueue.push(...questions);
    }
    isEmpty() {
        return this.#questionsQueue.length === 0;
    }
    async prompt(questions, initialAnswers) {
        if (!FakeInquirer.#isQuestionArray(questions))
            throw new Error("FakeInquirer only supports question arrays");
        const answers = { ...initialAnswers };
        await PromiseAllSequence(questions, async (question) => this.#askQuestion(question, answers));
        return answers;
    }
    static #isQuestionArray(questions) {
        return Array.isArray(questions);
    }
    async #askQuestion(question, answers) {
        if (!question.name)
            throw new Error("No name for a question... help!");
        const { name } = question;
        if ((name in answers) && !question.askAnswered)
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
            await PromiseAllSequence(fakeAnswers.validateFail, async (answer) => {
                await this.#validateAnswer(question, name, answer, answers, false, false);
            });
            await PromiseAllSequence(fakeAnswers.validatePass, async (answer) => {
                await this.#validateAnswer(question, name, answer, answers, true, false);
            });
            await this.#validateAnswer(question, name, fakeAnswers.answer, answers, true, true);
        }
        else if (fakeAnswers.validateFail.length ||
            fakeAnswers.validatePass.length) {
            throw new Error(`Validation test answers are present for a question with no validate method: "${name}" at index ${this.#passCount}`);
        }
        answers[name] = fakeAnswers.answer;
        this.#passCount++;
    }
    async #validateAnswer(question, name, answer, answers, shouldPass, isFinal) {
        if (!question.validate)
            throw new Error("assertion failure, we shouldn't get here");
        const result = await question.validate(answer, answers);
        if ((result === true) === shouldPass)
            return;
        throw new Error(`validation should have ${shouldPass ? "passed" : "failed"} on question "${name}" with ${isFinal ? "final " : ""}answer "${String(answer)}" at index ${this.#passCount}`);
    }
}
//# sourceMappingURL=FakeInquirer.js.map