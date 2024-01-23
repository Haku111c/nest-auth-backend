import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
// import { Rol } from "../interfaces/role";

export class CreateUserDto {
    @IsEmail()
    email:string;
    @IsString()
    name: string;
    @MinLength(6)
    password: string;
    // @IsOptional()
    // rol:Rol

} 
