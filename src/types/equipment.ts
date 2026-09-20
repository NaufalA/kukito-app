export type EquipmentCategory = 'cookware' | 'appliances' | 'prep' | 'measuring' | 'baking' | 'other';

export interface EquimentMeasurement {
  amount: number;
  unit: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  isAvailable: boolean;
  notes?: string;
  measurement?: EquimentMeasurement[];
}

export interface MeasuringEquipment extends Equipment {
  category: 'measuring';
  measurement: EquimentMeasurement[];
}

export interface BakingEquipment extends Equipment {
  category: 'baking';
  measurement: EquimentMeasurement[];
}
