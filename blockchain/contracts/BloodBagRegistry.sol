// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title BloodBagRegistry
 * @dev Smart contract for tracking blood bag events on the blockchain
 * @notice This contract maintains an immutable record of blood bag events
 */
contract BloodBagRegistry is Ownable {
    using Counters for Counters.Counter;
    
    // Structs
    struct BloodBag {
        string bagId;
        string bloodType;
        bool factorRh;
        uint256 collectionDate;
        uint256 expirationDate;
        string currentInstitutionId;
        string status;
        string hash;
        uint256 createdAt;
    }

    struct Event {
        uint256 eventId;
        string bagId;
        string eventType;
        string description;
        string institutionId;
        string userId;
        string hash;
        uint256 timestamp;
        string transactionId;
    }

    struct Transfer {
        uint256 transferId;
        string bagId;
        string fromInstitutionId;
        string toInstitutionId;
        string status;
        uint256 requestedAt;
        uint256? approvedAt;
        uint256? completedAt;
        string hash;
    }

    struct Demand {
        uint256 demandId;
        string institutionId;
        string bloodType;
        uint256 quantity;
        string urgency;
        string status;
        uint256 createdAt;
        uint256? closedAt;
        string hash;
    }

    // State variables
    Counters.Counter private _eventIds;
    Counters.Counter private _bagIds;
    Counters.Counter private _transferIds;
    Counters.Counter private _demandIds;

    // Mappings
    mapping(uint256 => BloodBag) private _bloodBags;
    mapping(uint256 => Event) private _events;
    mapping(uint256 => Transfer) private _transfers;
    mapping(uint256 => Demand) private _demands;
    
    mapping(string => uint256) private _bagIdToIndex;
    mapping(uint256 => uint256[]) private _bagEventIndices;
    mapping(uint256 => uint256[]) private _bagTransferIndices;
    
    mapping(string => uint256[]) private _institutionBagIndices;
    mapping(string => uint256[]) private _institutionEventIndices;

    // Events
    event BloodBagRegistered(
        uint256 indexed bagIndex,
        string bagId,
        string bloodType,
        string institutionId,
        uint256 timestamp
    );

    event EventRegistered(
        uint256 indexed eventId,
        string bagId,
        string eventType,
        string institutionId,
        uint256 timestamp
    );

    event TransferRegistered(
        uint256 indexed transferId,
        string bagId,
        string fromInstitutionId,
        string toInstitutionId,
        string status,
        uint256 timestamp
    );

    event DemandRegistered(
        uint256 indexed demandId,
        string institutionId,
        string bloodType,
        uint256 quantity,
        string urgency,
        uint256 timestamp
    );

    // ============================================
    // BLOOD BAG FUNCTIONS
    // ============================================

    /**
     * @dev Register a new blood bag on the blockchain
     * @param bagId Unique identifier for the blood bag
     * @param bloodType Blood type (A+, A-, B+, B-, AB+, AB-, O+, O-)
     * @param factorRh Rh factor (true = positive, false = negative)
     * @param collectionDate Timestamp of collection
     * @param expirationDate Timestamp of expiration
     * @param currentInstitutionId ID of the institution currently holding the bag
     * @param status Current status of the bag
     * @param hash Hash of the blood bag data for verification
     */
    function registerBloodBag(
        string memory bagId,
        string memory bloodType,
        bool factorRh,
        uint256 collectionDate,
        uint256 expirationDate,
        string memory currentInstitutionId,
        string memory status,
        string memory hash
    ) external returns (uint256) {
        _bagIds.increment();
        uint256 bagIndex = _bagIds.current();
        
        _bloodBags[bagIndex] = BloodBag({
            bagId: bagId,
            bloodType: bloodType,
            factorRh: factorRh,
            collectionDate: collectionDate,
            expirationDate: expirationDate,
            currentInstitutionId: currentInstitutionId,
            status: status,
            hash: hash,
            createdAt: block.timestamp
        });
        
        _bagIdToIndex[bagId] = bagIndex;
        _institutionBagIndices[currentInstitutionId].push(bagIndex);
        
        emit BloodBagRegistered(
            bagIndex,
            bagId,
            bloodType,
            currentInstitutionId,
            block.timestamp
        );
        
        return bagIndex;
    }

    /**
     * @dev Get blood bag information
     * @param bagIndex Index of the blood bag
     */
    function getBloodBag(uint256 bagIndex) external view returns (BloodBag memory) {
        return _bloodBags[bagIndex];
    }

    /**
     * @dev Get blood bag by ID
     * @param bagId Unique identifier for the blood bag
     */
    function getBloodBagById(string memory bagId) external view returns (BloodBag memory, bool) {
        uint256 bagIndex = _bagIdToIndex[bagId];
        if (bagIndex == 0) {
            return (BloodBag({}), false);
        }
        return (_bloodBags[bagIndex], true);
    }

    /**
     * @dev Update blood bag status
     * @param bagId Unique identifier for the blood bag
     * @param newStatus New status of the bag
     * @param hash Updated hash for verification
     */
    function updateBloodBagStatus(
        string memory bagId,
        string memory newStatus,
        string memory hash
    ) external returns (bool) {
        uint256 bagIndex = _bagIdToIndex[bagId];
        require(bagIndex != 0, "Blood bag not found");
        
        _bloodBags[bagIndex].status = newStatus;
        _bloodBags[bagIndex].hash = hash;
        
        return true;
    }

    // ============================================
    // EVENT FUNCTIONS
    // ============================================

    /**
     * @dev Register an event for a blood bag
     * @param bagId Unique identifier for the blood bag
     * @param eventType Type of event (COLETA, TESTE, APROVACAO, etc.)
     * @param description Description of the event
     * @param institutionId ID of the institution where the event occurred
     * @param userId ID of the user who performed the action
     * @param hash Hash of the event data for verification
     */
    function registerEvent(
        string memory bagId,
        string memory eventType,
        string memory description,
        string memory institutionId,
        string memory userId,
        string memory hash
    ) external returns (uint256) {
        _eventIds.increment();
        uint256 eventId = _eventIds.current();
        
        uint256 bagIndex = _bagIdToIndex[bagId];
        require(bagIndex != 0, "Blood bag not found");
        
        _events[eventId] = Event({
            eventId: eventId,
            bagId: bagId,
            eventType: eventType,
            description: description,
            institutionId: institutionId,
            userId: userId,
            hash: hash,
            timestamp: block.timestamp,
            transactionId: string(abi.encodePacked(block.timestamp, msg.sender))
        });
        
        _bagEventIndices[bagIndex].push(eventId);
        _institutionEventIndices[institutionId].push(eventId);
        
        emit EventRegistered(
            eventId,
            bagId,
            eventType,
            institutionId,
            block.timestamp
        );
        
        return eventId;
    }

    /**
     * @dev Get event information
     * @param eventId Index of the event
     */
    function getEvent(uint256 eventId) external view returns (Event memory) {
        return _events[eventId];
    }

    /**
     * @dev Get all events for a blood bag
     * @param bagId Unique identifier for the blood bag
     */
    function getBloodBagEvents(string memory bagId) external view returns (Event[] memory) {
        uint256 bagIndex = _bagIdToIndex[bagId];
        require(bagIndex != 0, "Blood bag not found");
        
        uint256[] memory eventIndices = _bagEventIndices[bagIndex];
        Event[] memory events = new Event[](eventIndices.length);
        
        for (uint256 i = 0; i < eventIndices.length; i++) {
            events[i] = _events[eventIndices[i]];
        }
        
        return events;
    }

    /**
     * @dev Verify event hash
     * @param eventId Index of the event
     * @param hash Hash to verify
     */
    function verifyEventHash(uint256 eventId, string memory hash) external view returns (bool) {
        Event memory event = _events[eventId];
        return keccak256(abi.encodePacked(
            event.bagId,
            event.eventType,
            event.institutionId,
            event.userId,
            event.timestamp,
            event.description
        )) == keccak256(abi.encodePacked(hash));
    }

    // ============================================
    // TRANSFER FUNCTIONS
    // ============================================

    /**
     * @dev Register a transfer request
     * @param bagId Unique identifier for the blood bag
     * @param fromInstitutionId ID of the institution sending the bag
     * @param toInstitutionId ID of the institution receiving the bag
     * @param status Initial status of the transfer
     * @param hash Hash of the transfer data
     */
    function registerTransfer(
        string memory bagId,
        string memory fromInstitutionId,
        string memory toInstitutionId,
        string memory status,
        string memory hash
    ) external returns (uint256) {
        _transferIds.increment();
        uint256 transferId = _transferIds.current();
        
        uint256 bagIndex = _bagIdToIndex[bagId];
        require(bagIndex != 0, "Blood bag not found");
        
        _transfers[transferId] = Transfer({
            transferId: transferId,
            bagId: bagId,
            fromInstitutionId: fromInstitutionId,
            toInstitutionId: toInstitutionId,
            status: status,
            requestedAt: block.timestamp,
            approvedAt: 0,
            completedAt: 0,
            hash: hash
        });
        
        _bagTransferIndices[bagIndex].push(transferId);
        
        emit TransferRegistered(
            transferId,
            bagId,
            fromInstitutionId,
            toInstitutionId,
            status,
            block.timestamp
        );
        
        return transferId;
    }

    /**
     * @dev Update transfer status
     * @param transferId Index of the transfer
     * @param newStatus New status of the transfer
     * @param hash Updated hash
     */
    function updateTransferStatus(
        uint256 transferId,
        string memory newStatus,
        string memory hash
    ) external returns (bool) {
        Transfer storage transfer = _transfers[transferId];
        require(transfer.transferId != 0, "Transfer not found");
        
        transfer.status = newStatus;
        transfer.hash = hash;
        
        if (keccak256(abi.encodePacked(newStatus)) == keccak256(abi.encodePacked("APROVADA"))) {
            transfer.approvedAt = block.timestamp;
        } else if (keccak256(abi.encodePacked(newStatus)) == keccak256(abi.encodePacked("COMPLETADA"))) {
            transfer.completedAt = block.timestamp;
        }
        
        return true;
    }

    /**
     * @dev Get transfer information
     * @param transferId Index of the transfer
     */
    function getTransfer(uint256 transferId) external view returns (Transfer memory) {
        return _transfers[transferId];
    }

    // ============================================
    // DEMAND FUNCTIONS
    // ============================================

    /**
     * @dev Register a demand for blood
     * @param institutionId ID of the institution creating the demand
     * @param bloodType Blood type requested
     * @param quantity Quantity requested
     * @param urgency Urgency level
     * @param status Initial status
     * @param hash Hash of the demand data
     */
    function registerDemand(
        string memory institutionId,
        string memory bloodType,
        uint256 quantity,
        string memory urgency,
        string memory status,
        string memory hash
    ) external returns (uint256) {
        _demandIds.increment();
        uint256 demandId = _demandIds.current();
        
        _demands[demandId] = Demand({
            demandId: demandId,
            institutionId: institutionId,
            bloodType: bloodType,
            quantity: quantity,
            urgency: urgency,
            status: status,
            createdAt: block.timestamp,
            closedAt: 0,
            hash: hash
        });
        
        emit DemandRegistered(
            demandId,
            institutionId,
            bloodType,
            quantity,
            urgency,
            block.timestamp
        );
        
        return demandId;
    }

    /**
     * @dev Update demand status
     * @param demandId Index of the demand
     * @param newStatus New status of the demand
     * @param hash Updated hash
     */
    function updateDemandStatus(
        uint256 demandId,
        string memory newStatus,
        string memory hash
    ) external returns (bool) {
        Demand storage demand = _demands[demandId];
        require(demand.demandId != 0, "Demand not found");
        
        demand.status = newStatus;
        demand.hash = hash;
        
        if (keccak256(abi.encodePacked(newStatus)) == keccak256(abi.encodePacked("ATENDIDA")) ||
            keccak256(abi.encodePacked(newStatus)) == keccak256(abi.encodePacked("CANCELADA")) ||
            keccak256(abi.encodePacked(newStatus)) == keccak256(abi.encodePacked("EXPIRADA"))) {
            demand.closedAt = block.timestamp;
        }
        
        return true;
    }

    /**
     * @dev Get demand information
     * @param demandId Index of the demand
     */
    function getDemand(uint256 demandId) external view returns (Demand memory) {
        return _demands[demandId];
    }

    // ============================================
    // VERIFICATION FUNCTIONS
    // ============================================

    /**
     * @dev Verify blood bag hash
     * @param bagId Unique identifier for the blood bag
     * @param hash Hash to verify
     */
    function verifyBloodBagHash(string memory bagId, string memory hash) external view returns (bool) {
        uint256 bagIndex = _bagIdToIndex[bagId];
        require(bagIndex != 0, "Blood bag not found");
        
        BloodBag memory bag = _bloodBags[bagIndex];
        return keccak256(abi.encodePacked(bag.hash)) == keccak256(abi.encodePacked(hash));
    }

    /**
     * @dev Get total number of blood bags
     */
    function getTotalBloodBags() external view returns (uint256) {
        return _bagIds.current();
    }

    /**
     * @dev Get total number of events
     */
    function getTotalEvents() external view returns (uint256) {
        return _eventIds.current();
    }

    /**
     * @dev Get total number of transfers
     */
    function getTotalTransfers() external view returns (uint256) {
        return _transferIds.current();
    }

    /**
     * @dev Get total number of demands
     */
    function getTotalDemands() external view returns (uint256) {
        return _demandIds.current();
    }
}
