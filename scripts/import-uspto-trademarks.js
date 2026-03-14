import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  buildUsptoTrademarkSourceFromCsvFile,
  splitUsptoTrademarkSource,
} from "../src/importers/uspto.js";
import { writeSourceFile } from "../src/schema/source-io.js";

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    inputFile: "",
    outputDir: path.resolve(process.cwd(), "data", "uspto", "full-sources"),
    chunkSize: 5000,
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--input-file") {
      options.inputFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--output-dir") {
      options.outputDir = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--chunk-size") {
      options.chunkSize = Number.parseInt(String(args.shift() || ""), 10);
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  if (!options.inputFile) {
    throw new Error(
      "Missing required option: --input-file <path-to-uspto-case-file-csv>",
    );
  }
  if (!Number.isInteger(options.chunkSize) || options.chunkSize < 1) {
    throw new Error("Invalid option: --chunk-size must be a positive integer");
  }

  return options;
}

export function replaceUsptoChunkSet({
  outputDir,
  chunkFiles,
  writeSource = writeSourceFile,
  fsImpl = fs,
  pathImpl = path,
}) {
  const stageDir = pathImpl.join(
    outputDir,
    `.stage-${process.pid}-${Date.now()}`,
  );
  const backupDir = pathImpl.join(
    outputDir,
    `.backup-${process.pid}-${Date.now()}`,
  );
  const existingFiles = fsImpl
    .readdirSync(outputDir)
    .filter(
      (file) => file.startsWith("uspto-trademarks-") && file.endsWith(".json"),
    );
  const stagedFiles = [];
  const movedFiles = [];

  fsImpl.mkdirSync(stageDir, { recursive: true });
  fsImpl.mkdirSync(backupDir, { recursive: true });

  try {
    for (const chunk of chunkFiles) {
      const filename = `${chunk.id}.json`;
      writeSource(pathImpl.join(stageDir, filename), chunk);
      stagedFiles.push(filename);
    }

    for (const file of existingFiles) {
      fsImpl.renameSync(
        pathImpl.join(outputDir, file),
        pathImpl.join(backupDir, file),
      );
    }

    for (const file of stagedFiles) {
      fsImpl.renameSync(
        pathImpl.join(stageDir, file),
        pathImpl.join(outputDir, file),
      );
      movedFiles.push(file);
    }
  } catch (error) {
    for (const file of movedFiles) {
      const targetFile = pathImpl.join(outputDir, file);
      if (fsImpl.existsSync(targetFile)) {
        fsImpl.rmSync(targetFile, { force: true });
      }
    }

    for (const file of existingFiles) {
      const backupFile = pathImpl.join(backupDir, file);
      if (fsImpl.existsSync(backupFile)) {
        fsImpl.renameSync(backupFile, pathImpl.join(outputDir, file));
      }
    }

    throw error;
  } finally {
    if (fsImpl.existsSync(stageDir)) {
      fsImpl.rmSync(stageDir, { recursive: true, force: true });
    }
    if (fsImpl.existsSync(backupDir)) {
      fsImpl.rmSync(backupDir, { recursive: true, force: true });
    }
  }
}

async function main(argv) {
  const options = parseArgs(argv);
  fs.mkdirSync(options.outputDir, { recursive: true });
  const source = await buildUsptoTrademarkSourceFromCsvFile(options.inputFile);
  const chunkFiles = splitUsptoTrademarkSource(source, {
    chunkSize: options.chunkSize,
  });
  replaceUsptoChunkSet({ outputDir: options.outputDir, chunkFiles });

  console.log(
    `Wrote ${chunkFiles.length} files (${source.rules.length} terms total)`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
