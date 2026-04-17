import React, { useMemo, useState } from "react";
import { ethers } from "ethers";
import classRoomArtifact from "../../../contract/generated/ClassRoomIsolated.json";
import quizArtifact from "../../../contract/generated/QuizDappIsolated.json";
import {
    DEFAULT_CLASS_ROOM_ADDRESS,
    DEFAULT_QUIZ_ADDRESS,
    readRuntimeContractOverrides,
    resetRuntimeContractOverrides,
    saveRuntimeContractOverrides,
    token_address,
    ttt_token_address,
} from "../../../contract/config";

function shorten(address) {
    const value = String(address || "");
    if (!value) return "-";
    return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function isValidAddress(value) {
    try {
        if (!value) return false;
        if (ethers.utils && typeof ethers.utils.getAddress === "function") {
            return Boolean(ethers.utils.getAddress(value));
        }
        return false;
    } catch (error) {
        return false;
    }
}

async function createWalletSigner() {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const signer = provider.getSigner();
    return { provider, signer };
}

async function waitForDeploymentAndGetAddress(contract) {
    if (!contract) return "";

    if (typeof contract.waitForDeployment === "function") {
        await contract.waitForDeployment();
    } else if (contract.deployTransaction?.wait) {
        await contract.deployTransaction.wait();
    }

    if (typeof contract.getAddress === "function") {
        return await contract.getAddress();
    }

    return String(contract.target || contract.address || "");
}

function IsolatedEnvDeployer(props) {
    const currentOverrides = useMemo(() => readRuntimeContractOverrides(), []);
    const [status, setStatus] = useState("");
    const [deploying, setDeploying] = useState(false);
    const [classRoomAddress, setClassRoomAddress] = useState(currentOverrides?.class_room_address || "");
    const [quizAddress, setQuizAddress] = useState(currentOverrides?.quiz_address || "");
    const [savedConfig, setSavedConfig] = useState(currentOverrides || null);

    const deployFreshEnvironment = async () => {
        if (!props.cont?.getEthereumProvider?.()) {
            alert("MetaMask が見つかりません。MetaMask を有効にしてから再度お試しください。");
            return;
        }

        setDeploying(true);
        setStatus("MetaMask 接続と Polygon Amoy 切り替えを確認しています...");

        try {
            await props.cont.request_wallet_access();
            await props.cont.ensure_amoy_network();

            if (!isValidAddress(token_address) || !isValidAddress(ttt_token_address)) {
                throw new Error("platform_token_address_missing");
            }

            const { signer } = await createWalletSigner();
            const signerAddress = await signer.getAddress();

            setStatus("新しい class_room をデプロイしています。MetaMask を承認してください...");
            const classRoomFactory = new ethers.ContractFactory(classRoomArtifact.abi, classRoomArtifact.bytecode, signer);
            const classRoomContract = await classRoomFactory.deploy(token_address, ttt_token_address);
            const nextClassRoomAddress = await waitForDeploymentAndGetAddress(classRoomContract);
            if (!isValidAddress(nextClassRoomAddress)) {
                throw new Error("class_room_deploy_address_missing");
            }

            setStatus("新しい quiz をデプロイしています。MetaMask を承認してください...");
            const quizFactory = new ethers.ContractFactory(quizArtifact.abi, quizArtifact.bytecode, signer);
            const quizContract = await quizFactory.deploy(nextClassRoomAddress);
            const nextQuizAddress = await waitForDeploymentAndGetAddress(quizContract);
            if (!isValidAddress(nextQuizAddress)) {
                throw new Error("quiz_deploy_address_missing");
            }

            setClassRoomAddress(nextClassRoomAddress);
            setQuizAddress(nextQuizAddress);
            setStatus(`デプロイ完了: class_room ${nextClassRoomAddress} / quiz ${nextQuizAddress}`);

            const nextConfig = saveRuntimeContractOverrides({
                class_room_address: nextClassRoomAddress,
                quiz_address: nextQuizAddress,
                legacy_quiz_addresses: [],
                token_address,
                ttt_token_address,
            });
            setSavedConfig(nextConfig);

            alert(
                `新しい環境を作成しました。\n`
                + `deploy 実行者 ${signerAddress} は新しい class_room 上で教員として登録済みです。\n`
                + `このあとページを再読み込みすると test20 は新しい登録・学生・問題環境を参照します。`
            );
        } catch (error) {
            console.error("Failed to deploy isolated environment", error);
            const message = error?.message || "デプロイに失敗しました。";
            setStatus(message);
            if (message === "platform_token_address_missing") {
                alert("TFT または TTT のトークンアドレスが空です。既定値を確認してから再度お試しください。");
                return;
            }
            alert(message);
        } finally {
            setDeploying(false);
        }
    };

    const applyCurrentAddresses = () => {
        if (!classRoomAddress || !quizAddress) {
            alert("class_room と quiz の両方のアドレスを入力してください。");
            return;
        }

        const nextConfig = saveRuntimeContractOverrides({
            class_room_address: classRoomAddress,
            quiz_address: quizAddress,
            legacy_quiz_addresses: [],
            token_address,
            ttt_token_address,
        });
        setSavedConfig(nextConfig);
        setStatus("入力したアドレスを test20 の実行環境に保存しました。");
        alert("test20 の参照先を新しい class_room / quiz に切り替えました。ページを再読み込みしてください。");
    };

    const restoreDefaults = () => {
        resetRuntimeContractOverrides();
        setClassRoomAddress("");
        setQuizAddress("");
        setSavedConfig(null);
        setStatus("既定のアドレスへ戻しました。");
        alert("既定のアドレスへ戻しました。ページを再読み込みしてください。");
    };

    return (
        <div style={{ display: "grid", gap: "16px" }}>
            <div className="glass-card" style={{ padding: "16px", color: "#fff" }}>
                <h3 className="section-title" style={{ marginBottom: "10px" }}>完全新規の test20 環境を作成</h3>
                <p className="section-desc" style={{ marginBottom: "14px" }}>
                    新しい `class_room` と `quiz` を MetaMask から発行し、そのアドレスを test20 に保存します。
                    これで登録、学生一覧、問題一覧を既存環境から切り離せます。
                </p>
                <div style={{ display: "grid", gap: "8px", color: "rgba(255,255,255,0.84)" }}>
                    <div>既定の class_room: {shorten(DEFAULT_CLASS_ROOM_ADDRESS)}</div>
                    <div>既定の quiz: {shorten(DEFAULT_QUIZ_ADDRESS)}</div>
                    <div>TFT トークン: {shorten(token_address)}</div>
                    <div>TTT トークン: {shorten(ttt_token_address)}</div>
                </div>
            </div>

            <div className="glass-card" style={{ padding: "16px", color: "#fff", display: "grid", gap: "12px" }}>
                <button
                    type="button"
                    className="btn-primary-custom"
                    onClick={deployFreshEnvironment}
                    disabled={deploying}
                >
                    {deploying ? "デプロイ中..." : "MetaMask で新しい環境をデプロイ"}
                </button>

                <div style={{ color: "rgba(255,255,255,0.8)" }}>{status || "まだデプロイしていません。"}</div>

                <div>
                    <label style={{ display: "block", marginBottom: "6px" }}>class_room アドレス</label>
                    <input
                        className="form-control-custom"
                        value={classRoomAddress}
                        onChange={(event) => setClassRoomAddress(event.target.value)}
                        placeholder="0x..."
                    />
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "6px" }}>quiz アドレス</label>
                    <input
                        className="form-control-custom"
                        value={quizAddress}
                        onChange={(event) => setQuizAddress(event.target.value)}
                        placeholder="0x..."
                    />
                </div>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button type="button" className="btn btn-secondary" onClick={applyCurrentAddresses}>
                        入力したアドレスを適用
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={restoreDefaults}>
                        既定へ戻す
                    </button>
                </div>
            </div>

            <div className="glass-card" style={{ padding: "16px", color: "#fff" }}>
                <div style={{ fontWeight: 700, marginBottom: "8px" }}>現在の test20 参照先</div>
                <div style={{ display: "grid", gap: "6px", color: "rgba(255,255,255,0.84)" }}>
                    <div>class_room: {savedConfig?.class_room_address || DEFAULT_CLASS_ROOM_ADDRESS}</div>
                    <div>quiz: {savedConfig?.quiz_address || DEFAULT_QUIZ_ADDRESS}</div>
                </div>
            </div>
        </div>
    );
}

export default IsolatedEnvDeployer;
