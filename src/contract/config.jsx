import { scopeStorageKey } from "../utils/storageScope";

//const chainId = "0x13881"; // (required) chainId to be used
//const rpc = "https://rpc-mumbai.maticvigil.com/"; // (required for Ethereum) JSON RPC endpoint

const chainId = "0x13882"; // (required) chainId to be used
const rpc_urls = [
    "https://rpc-amoy.polygon.technology/",
    "https://polygon-amoy.drpc.org",
    "https://polygon-amoy-bor-rpc.publicnode.com",
];
const rpc = rpc_urls[0]; // default RPC endpoint

//const quiz_address = "0xB80f73B6be80f39b30bd8624368cDd57E0db3ff5";
//const token_address = "0x1ceA098E584e46c7659f8460d3c13Cec2D0B22F4";

//const quiz_address = "0x681913855E68BBF88962A40E4f3f48cB78fc9603";
//const quiz_address = "0xAb3Ec4a039fb6aBb66Cf00460d27839a9C196B94";//応用数学一回目
//const quiz_address = "0x5d12efccbd81c60c80e5e2caffa480f2cf80a813"//test10

const CONTRACT_OVERRIDE_STORAGE_KEY = scopeStorageKey("contract_address_overrides_v1");

const DEFAULT_CLASS_ROOM_ADDRESS = "0xa9AA6D24ecF43fEd6203680866f78B9A4798A8e0";
const DEFAULT_QUIZ_ADDRESS = "0x5E718ee4D83d5E7e733BD6672afb1B14C9e0925b";
const DEFAULT_LEGACY_QUIZ_ADDRESSES = [];
const DEFAULT_TOKEN_ADDRESS = "0x021e416bb6bfA1e76Aa4E280828b1d55F2d5f2F0";
const DEFAULT_TTT_TOKEN_ADDRESS = "0x22b6457aC35b2A839EE6eb47c91f0941E1b21476";
const DEFAULT_BOOTSTRAP_TEACHER_ADDRESSES = [
    "0xd5670D7B88411d03741680451C2ea630B68C6944",
];

let class_room_address = DEFAULT_CLASS_ROOM_ADDRESS;
let quiz_address = DEFAULT_QUIZ_ADDRESS;
let legacy_quiz_addresses = [...DEFAULT_LEGACY_QUIZ_ADDRESSES];
let token_address = DEFAULT_TOKEN_ADDRESS;
let ttt_token_address = DEFAULT_TTT_TOKEN_ADDRESS;
let bootstrap_teacher_addresses = [...DEFAULT_BOOTSTRAP_TEACHER_ADDRESSES];

function normalizeAddressList(value, fallback = []) {
    return Array.isArray(value) ? value.filter(Boolean).map((item) => String(item)) : [...fallback];
}

function applyRuntimeContractOverrides(overrides = {}) {
    class_room_address = String(overrides.class_room_address || DEFAULT_CLASS_ROOM_ADDRESS);
    quiz_address = String(overrides.quiz_address || DEFAULT_QUIZ_ADDRESS);
    legacy_quiz_addresses = normalizeAddressList(overrides.legacy_quiz_addresses, DEFAULT_LEGACY_QUIZ_ADDRESSES);
    token_address = String(overrides.token_address || DEFAULT_TOKEN_ADDRESS);
    ttt_token_address = String(overrides.ttt_token_address || DEFAULT_TTT_TOKEN_ADDRESS);
    bootstrap_teacher_addresses = normalizeAddressList(
        overrides.bootstrap_teacher_addresses,
        DEFAULT_BOOTSTRAP_TEACHER_ADDRESSES
    );
}

function readRuntimeContractOverrides() {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(CONTRACT_OVERRIDE_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch (error) {
        return null;
    }
}

function loadRuntimeContractOverrides() {
    const overrides = readRuntimeContractOverrides();
    applyRuntimeContractOverrides(overrides || {});
    return overrides;
}

function saveRuntimeContractOverrides(overrides = {}) {
    const nextOverrides = {
        class_room_address: String(overrides.class_room_address || DEFAULT_CLASS_ROOM_ADDRESS),
        quiz_address: String(overrides.quiz_address || DEFAULT_QUIZ_ADDRESS),
        legacy_quiz_addresses: normalizeAddressList(overrides.legacy_quiz_addresses, DEFAULT_LEGACY_QUIZ_ADDRESSES),
        token_address: String(overrides.token_address || DEFAULT_TOKEN_ADDRESS),
        ttt_token_address: String(overrides.ttt_token_address || DEFAULT_TTT_TOKEN_ADDRESS),
        bootstrap_teacher_addresses: normalizeAddressList(
            overrides.bootstrap_teacher_addresses,
            DEFAULT_BOOTSTRAP_TEACHER_ADDRESSES
        ),
    };

    if (typeof window !== "undefined") {
        window.localStorage.setItem(CONTRACT_OVERRIDE_STORAGE_KEY, JSON.stringify(nextOverrides));
    }
    applyRuntimeContractOverrides(nextOverrides);
    return nextOverrides;
}

function resetRuntimeContractOverrides() {
    if (typeof window !== "undefined") {
        window.localStorage.removeItem(CONTRACT_OVERRIDE_STORAGE_KEY);
    }
    applyRuntimeContractOverrides({});
}

loadRuntimeContractOverrides();

export {
    DEFAULT_BOOTSTRAP_TEACHER_ADDRESSES,
    DEFAULT_CLASS_ROOM_ADDRESS,
    DEFAULT_LEGACY_QUIZ_ADDRESSES,
    DEFAULT_QUIZ_ADDRESS,
    DEFAULT_TOKEN_ADDRESS,
    DEFAULT_TTT_TOKEN_ADDRESS,
    bootstrap_teacher_addresses,
    chainId,
    class_room_address,
    legacy_quiz_addresses,
    loadRuntimeContractOverrides,
    quiz_address,
    readRuntimeContractOverrides,
    resetRuntimeContractOverrides,
    rpc,
    rpc_urls,
    saveRuntimeContractOverrides,
    token_address,
    ttt_token_address,
};
