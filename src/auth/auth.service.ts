import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model, ObjectId } from 'mongoose';
import * as bcriptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload';
import { LoginResponse } from './interfaces/login-response';
import {
  RegisterDto,
  CreateUserDto,
  UpdateAuthDto,
  LoginDto,
} from './dto/index';
import { Retoken } from './dto/retoken.dto';
type Response =
  | { name: string; status: boolean; user: User }
  | { status: boolean; message: string; statusCode: number }
  | { user: User; token: string; status: boolean };
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}
  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const { password, ...userData } = createUserDto;

      const newUser = new this.userModel({
        password: bcriptjs.hashSync(password, 10),
        ...userData,
      });
      const savedUser = await newUser.save();
      //no olvidar el await ya que sino colocamos el await no retornara nada y si hay error entonces no lanzara el error
      return savedUser;
    } catch (error) {
      console.log(error.code);
      if (error.code === 11000) {
        throw new BadRequestException(`${createUserDto.email} already exists!`);
        // return {
        //   status:false,
        //   message:`${createUserDto.email} already exists!`
        // }
      }
      // return {
      //   status:false,
      //   message:`Something terribe happend!!!`,
      //   statusCode: 500
      // }
      throw new InternalServerErrorException('Something terribe happend!!!');
    }
    //1- encriptar la contraseña
    //2 - guardar el usuario
    //3 - generar el jwt
  }
  async register(registerDto: RegisterDto): Promise<LoginResponse> {
    const user = await this.create(registerDto);
    return {
      user,
      token: this.getJwtToken({ id: user._id }),
    };
  }
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email });
    //ver la forma de cambiar y colocarle un status
    if (!user) throw new UnauthorizedException('Not valid credentials - email');
    if (!bcriptjs.compareSync(password, user.password))
      throw new UnauthorizedException('Not valid credentials - password');
    //vamos a convertir nuestro user en un json ya que si lo traemos asi nomas nos trae informacion que no necesitamos
    const { ...rest } = user.toJSON();
    rest.password = '_';
    return {
      user: rest,
      token: this.getJwtToken({ id: user.id }),
    };

    /**
     *User
     *Token
     **/
  }

  findAll(): Promise<User[]> {
    return this.userModel.find();
  }
  checkToken(user: User): LoginResponse {
    return {
      user,
      token: this.getJwtToken({ id: user._id }),
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }
  //podriamos colocarle que devuelva una promesa de tipo User
  //pero eso significaria que tengamos que agregar el ? en el password de nuestro
  //entity
  // async findUserById(id: string): Promise<User> {
  async findUserById(id: string) {
    const user = await this.userModel.findById(id);
    const { password, ...rest } = user.toJSON();
    return rest;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
  //metodo que recibe el payload que ser de tipo JWTPayload
  getJwtToken(payload: JwtPayload): string {
    //usando el metodo signAsync vamos a crear nuestro token
    const token = this.jwtService.sign(payload);
    console.log(token);
    return token;
  }
}
