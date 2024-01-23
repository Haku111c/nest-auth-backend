import { IsString } from 'class-validator';

export class Retoken {
  @IsString()
  token: string;
}
