// import fs module
import { readdir, rm } from "fs/promises";
import { existsSync } from "fs";

import * as shell from "shelljs";

// import path module
import * as path from "path";

// Constant Value
const DIRECTORY_PATH = "C:/Users/jhryu/Documents/cals/LambdaV2";

/**
 * @desc
 * 삭제 대상 이름 상수
 */
const TARGET_NAME_ARRAY = ["node_modules", "pnpm-lock.yaml"];

// logger util
function logger(
  message: string,
  type: "start" | "end" | "success" | "info" | "install" | "error",
  optionMessage?: string
) {
  switch (type) {
    case "start":
      if (message.includes("Update")) {
        console.log("");
      }
      console.log(`📢 Start : [${message}]`);
      if (message === "Process") {
        console.log(`ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ`);
      }
      break;
    case "end":
      if (message === "Process") {
        console.log(`ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ`);
      }
      console.log(
        `📢 End : [${message}]${optionMessage ? ` | ${optionMessage}` : ""}`
      );
      if (message.includes("Update")) {
        console.log("");
      }
      break;
    case "success":
      console.log(
        `✅ Success [${message}]${optionMessage ? ` | ${optionMessage}` : ""}`
      );
      break;
    case "info":
      console.log(
        `☑️  Info : [${message}${optionMessage ? " - " + optionMessage : ""}]`
      );
      break;
    case "install":
      if (message.includes("Start")) {
        console.log("");
      }
      console.log(`⭐ Install : ${message}`);
      if (message.includes("End")) {
        console.log("");
      }
      break;
    case "error":
      console.log(`⚠️  Error : [${message}]`);
      break;
  }
}

/**
 * makeDirList
 * @desc 지정된 Path에 존재하는 폴더들의 이름을 배열화하여 리턴
 * @returns string[]
 */
async function makeDirList(): Promise<string[]> {
  try {
    let files: string[] = await readdir(DIRECTORY_PATH);
    files = files.filter((file) => file !== "updateAllLambda");
    logger("Directory Reading", "success");
    return files;
  } catch (err) {
    logger("Directory Reading", "error");
    return [];
  }
}

/**
 * removeTarget
 * @desc 대상 파일 혹은 폴더를 삭제
 * @param folderName 삭제를 수행할 폴더 경로
 * @returns Promise<boolean>
 */
async function removeTarget(folderName: string): Promise<boolean> {
  // package.json이 없으면 진행하지 않음
  if (!existsSync(path.join(DIRECTORY_PATH, folderName, "package.json"))) {
    logger("package.json Not Found", "error");
    logger(`Update : ${folderName}`, "end");
    return false;
  }

  // 삭제 대상 배열을 순회하며 대상 존재 확인 후 존재하면 삭제
  for (let i = 0; i < TARGET_NAME_ARRAY.length; i++) {
    const TARGET_PATH = path.join(
      DIRECTORY_PATH,
      folderName,
      TARGET_NAME_ARRAY[i]
    );

    if (existsSync(TARGET_PATH)) {
      logger(`${TARGET_NAME_ARRAY[i]} :  Exist`, "info");
      await rm(TARGET_PATH, { recursive: true });
      logger(`delete : ${TARGET_NAME_ARRAY[i]}`, "success");
    } else {
      logger(`${TARGET_NAME_ARRAY[i]} : Not Exists`, "info");
    }
  }

  logger("remove", "success");
  return true;
}

/**
 * installNodeModules
 * @desc 새로운 node_modules 설치
 * @param folderName 설치를 수행할 폴더명
 * @returns Promise<boolean>
 */
async function installNodeModules(folderName: string): Promise<boolean> {
  const cwd = path.join(DIRECTORY_PATH, folderName);

  logger(`working in`, "info", cwd);
  logger("[node_modules] Start", "install");

  try {
    shell.exec(`cd ${cwd} && pnpm i`);
    logger("[node_modules] End", "install");
    return true;
  } catch (error: any) {
    logger(`${error.message}`, "error");
    return false;
  }
}

async function main() {
  const lambdaDirList = await makeDirList();
  // Error Case #1
  if (lambdaDirList.length === 0) {
    return;
  }

  logger("Process", "start");
  // 람다 폴더 배열

  for (let i = 0; i < lambdaDirList.length; i++) {
    logger(`Update : ${lambdaDirList[i]}`, "start");

    const step1 = await removeTarget(lambdaDirList[i]);
    if (!step1) {
      continue;
    }

    const step2 = await installNodeModules(lambdaDirList[i]);

    if (!step2) {
      continue;
    }

    logger(`Update : ${lambdaDirList[i]}`, "end");
  }
  logger("Process", "end");
}

main();
