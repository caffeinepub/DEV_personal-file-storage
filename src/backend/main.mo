import Map "mo:core/Map";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";

actor {
  type FileRecord = {
    id : Text;
    owner : Principal;
    name : Text;
    size : Nat64;
    mimeType : Text;
    uploadedAt : Int;
    blobId : Text;
  };

  module FileRecord {
    public func compare(file1 : FileRecord, file2 : FileRecord) : Order.Order {
      Text.compare(file1.id, file2.id);
    };
  };

  type UserProfile = {
    name : Text;
  };

  include MixinStorage();

  let files = Map.empty<Text, FileRecord>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profile functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // List caller's own files
  public query ({ caller }) func getMyFiles() : async [FileRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list files");
    };
    files.values().toArray().filter(func(file) { file.owner == caller }).sort();
  };

  // List all files (admin only)
  public query ({ caller }) func getAllFiles() : async [FileRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all files");
    };
    files.values().toArray().sort();
  };

  // Upload file metadata (blob storage handles actual upload)
  public shared ({ caller }) func uploadFile(id : Text, name : Text, size : Nat64, mimeType : Text, blobId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload files");
    };
    let record : FileRecord = {
      id;
      owner = caller;
      name;
      size;
      mimeType;
      uploadedAt = Time.now();
      blobId;
    };
    files.add(id, record);
  };

  // Delete file
  public shared ({ caller }) func deleteFile(fileId : Text) : async () {
    switch (files.get(fileId)) {
      case (null) { Runtime.trap("File not found") };
      case (?file) {
        if (file.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own files");
        };
        files.remove(fileId);
      };
    };
  };

  // Get total storage used by caller
  public query ({ caller }) func getTotalStorageUsed() : async Nat64 {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query storage usage");
    };
    var total : Nat64 = 0;
    for (file in files.values()) {
      if (file.owner == caller) {
        total += file.size;
      };
    };
    total;
  };

  // Get remaining storage capacity
  public query ({ caller }) func getRemainingStorageCapacity() : async Nat64 {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query storage capacity");
    };
    var total : Nat64 = 0;
    for (file in files.values()) {
      if (file.owner == caller) {
        total += file.size;
      };
    };
    total;
  };

  // Get single file metadata
  public query ({ caller }) func getFileMetadata(fileId : Text) : async FileRecord {
    switch (files.get(fileId)) {
      case (null) { Runtime.trap("File not found") };
      case (?file) {
        if (file.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only access your own files");
        };
        file;
      };
    };
  };
};
