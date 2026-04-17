const fs = require("fs");
const path = require("path");
const solc = require("solc");

const projectRoot = path.resolve(__dirname, "..");
const contracts = [
    {
        sourcePath: path.join(projectRoot, "solidity", "class_room.sol"),
        sourceName: "class_room.sol",
        contractName: "class_room",
        outputPath: path.join(projectRoot, "src", "contract", "generated", "ClassRoomIsolated.json"),
    },
    {
        sourcePath: path.join(projectRoot, "solidity", "quiz.sol"),
        sourceName: "quiz.sol",
        contractName: "Quiz_Dapp",
        outputPath: path.join(projectRoot, "src", "contract", "generated", "QuizDappIsolated.json"),
    },
];

function loadSource(filePath) {
    return fs.readFileSync(filePath, "utf8");
}

function resolveImport(importPath) {
    const candidates = [
        path.join(projectRoot, "solidity", importPath),
        path.join(projectRoot, "solidity", ".deps", "npm", importPath),
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return { contents: loadSource(candidate) };
        }
    }

    return { error: `Import not found: ${importPath}` };
}

function compile() {
    const input = {
        language: "Solidity",
        sources: contracts.reduce((acc, contract) => {
            acc[contract.sourceName] = { content: loadSource(contract.sourcePath) };
            return acc;
        }, {}),
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            outputSelection: {
                "*": {
                    "*": ["abi", "evm.bytecode.object"],
                },
            },
        },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input), { import: resolveImport }));
    const errors = Array.isArray(output.errors) ? output.errors : [];
    const fatalErrors = errors.filter((entry) => entry.severity === "error");

    if (fatalErrors.length > 0) {
        fatalErrors.forEach((entry) => console.error(entry.formattedMessage || entry.message));
        throw new Error("solidity_compile_failed");
    }

    contracts.forEach((contract) => {
        const compiled = output.contracts?.[contract.sourceName]?.[contract.contractName];
        if (!compiled?.abi || !compiled?.evm?.bytecode?.object) {
            throw new Error(`compiled_output_missing:${contract.contractName}`);
        }

        fs.mkdirSync(path.dirname(contract.outputPath), { recursive: true });
        fs.writeFileSync(
            contract.outputPath,
            JSON.stringify(
                {
                    contractName: contract.contractName,
                    sourceName: contract.sourceName,
                    abi: compiled.abi,
                    bytecode: `0x${compiled.evm.bytecode.object}`,
                },
                null,
                2
            )
        );
        console.log(`Wrote ${path.relative(projectRoot, contract.outputPath)}`);
    });
}

compile();
