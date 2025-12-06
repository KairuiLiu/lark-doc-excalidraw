/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
    locales: ["en-US", "zh-CN"],
    sourceLocale: "zh-CN",
    catalogs: [
        {
            path: "<rootDir>/src/locales/{locale}/messages",
            include: ["<rootDir>/src"],
        },
    ],
    format: "po",
};
