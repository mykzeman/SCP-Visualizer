
export interface ScpData {
    name: string;
    class: string;
    containment: string;
    description: string;
    imageUrl: string;
    isSaved?: boolean;
}

export interface ScpInfo {
    name: string;
    class: string;
    containment: string;
    description: string;
}

export interface ScpError {
    scpId: string;
    message: string;
}