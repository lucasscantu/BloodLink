// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title BloodChainRegistry
/// @notice Registro imutável de eventos de custódia de bolsas de sangue.
/// @dev Projeto ACADÊMICO. Nenhum dado pessoal ou sensível é armazenado aqui,
///      apenas identificadores, tipos de evento e hashes SHA-256 dos dados
///      detalhados que permanecem no banco de dados relacional (PostgreSQL).
///      Não existe função de update ou delete: uma vez registrado, um evento
///      não pode ser alterado, apenas novos eventos podem ser adicionados
///      (append-only), o que garante a imutabilidade do histórico.
contract BloodChainRegistry {
    struct BagEvent {
        string bagId;          // identificador lógico da bolsa (não é dado pessoal)
        string eventType;      // ex: COLETA, APROVACAO, TRANSFERENCIA_CRIADA...
        string institutionId;  // instituição responsável
        string userId;         // usuário responsável (id interno, não CPF/nome)
        bytes32 dataHash;      // SHA-256 dos dados detalhados do evento
        uint256 timestamp;
    }

    // bagId => lista de eventos (histórico completo, imutável)
    mapping(string => BagEvent[]) private history;

    // contador de eventos por bolsa, para referência rápida
    mapping(string => uint256) public eventCount;

    event EventRegistered(
        string indexed bagId,
        uint256 indexed eventIndex,
        string eventType,
        string institutionId,
        string userId,
        bytes32 dataHash,
        uint256 timestamp
    );

    /// @notice Registra um novo evento imutável para uma bolsa.
    /// @dev Função genérica usada pelo BlockchainService do backend para
    ///      implementar registerBloodBag, approveBloodBag, rejectBloodBag,
    ///      transferBloodBag, receiveBloodBag, reserveBloodBag, useBloodBag,
    ///      discardBloodBag e registerEvent — cada uma dessas operações do
    ///      domínio corresponde a uma chamada desta função com um eventType
    ///      diferente, mantendo o contrato simples e auditável.
    function registerEvent(
        string calldata bagId,
        string calldata eventType,
        string calldata institutionId,
        string calldata userId,
        bytes32 dataHash
    ) external returns (uint256 eventIndex) {
        eventIndex = history[bagId].length;

        history[bagId].push(
            BagEvent({
                bagId: bagId,
                eventType: eventType,
                institutionId: institutionId,
                userId: userId,
                dataHash: dataHash,
                timestamp: block.timestamp
            })
        );

        eventCount[bagId] = eventIndex + 1;

        emit EventRegistered(
            bagId,
            eventIndex,
            eventType,
            institutionId,
            userId,
            dataHash,
            block.timestamp
        );
    }

    /// @notice Retorna o histórico completo de eventos de uma bolsa.
    function getBloodBagHistory(string calldata bagId) external view returns (BagEvent[] memory) {
        return history[bagId];
    }

    /// @notice Retorna um evento específico do histórico de uma bolsa.
    function getEvent(string calldata bagId, uint256 index) external view returns (BagEvent memory) {
        require(index < history[bagId].length, "Evento inexistente");
        return history[bagId][index];
    }

    /// @notice Verifica se um hash informado corresponde ao hash registrado
    ///         on-chain para um determinado evento (integridade).
    function verifyEvent(
        string calldata bagId,
        uint256 index,
        bytes32 expectedHash
    ) external view returns (bool) {
        require(index < history[bagId].length, "Evento inexistente");
        return history[bagId][index].dataHash == expectedHash;
    }
}
