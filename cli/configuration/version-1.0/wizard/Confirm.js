export default async function InquirerConfirm(sharedArguments, message = "Are you okay with your choices so far?") {
    const { ok } = await sharedArguments.inquirer.prompt([
        {
            name: "ok",
            type: "confirm",
            default: false,
            message,
        }
    ]);
    return ok;
}
//# sourceMappingURL=Confirm.js.map