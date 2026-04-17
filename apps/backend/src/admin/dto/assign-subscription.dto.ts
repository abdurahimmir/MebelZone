import { IsUUID } from 'class-validator';

export class AssignSubscriptionDto {
  @IsUUID()
  tariffId!: string;
}
