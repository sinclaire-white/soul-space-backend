export interface IAvailability {
    id: string;
    consultantId: string;
    dayOfWeek: number;
    startTime: Date;
    endTime: Date;
    isRecurring: boolean;
    isBlocked: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAvailabilityCreate {
    dayOfWeek: number;
    startTime: Date;
    endTime: Date;
    isRecurring?: boolean;
    isBlocked?: boolean;
}

export interface IAvailabilityUpdate {
    dayOfWeek?: number;
    startTime?: Date;
    endTime?: Date;
    isRecurring?: boolean;
    isBlocked?: boolean;
}

export interface ITimeSlot {
    startTime: Date;
    endTime: Date;
    isAvailable: boolean;
}

export interface IDaySchedule {
    dayOfWeek: number;
    date: Date;
    slots: ITimeSlot[];
}
