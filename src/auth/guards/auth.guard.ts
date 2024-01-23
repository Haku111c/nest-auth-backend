import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { JwtPayload } from '../interfaces/jwt-payload';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  //para hacer las validaciones vamos a importar el jwtService
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}
  async canActivate(
    //contexto donde se va a ejecutar el guard, este nos proporciona informacion sobre el contexto donde se realiza la peticion
    context: ExecutionContext,
    //esto es lo que retorna un boolean una promesa con un boolean o un observable con un boolean, si retorna un true entonces la persona puede ingresar a la ruta
    // ): boolean | Promise<boolean> | Observable<boolean> {
  ): Promise<boolean> {
    // usando el metodo switchToHttp de nuestro context y a la vez usando el getRequest vamos a obtener la solicitud o parametros de la solicitud
    const request = context.switchToHttp().getRequest();
    //*extraemos el token usando la funcion
    const token = this.extractTokenFromHeader(request);
    console.log({ token });
    if (!token) {
      throw new UnauthorizedException('Error en el token');
    }
    //vamos a extraer el payload para ello creamos un await y usando el metodo verifyAsync que recibe el parametro y un objeto con nuestro secret
    //este metodo va retonar data de tipo JwtPayload
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SEED,
      });
      console.log(payload);
      //usando nuestro metodo findUserById vamos a buscar al usuario
      const user = await this.authService.findUserById(payload.id);
      if (!user) throw new UnauthorizedException('Use does not exists');
      if (!user.isActive)
        throw new UnauthorizedException('User is not active ');
      //vamos a crear una nueva propiedad en la request y este tendra el valor usuario
      request['user'] = user;
    } catch (error) {
      throw new UnauthorizedException('Not Authorized');
    }
    // return Promise.resolve(true);
    return true;
  }
  //*esta es una funcion de la documentacion de nest
  private extractTokenFromHeader(request: Request): string | undefined {
    //vamos a extraer el tipo y token desde nuestros headers que viene en la peticion
    //usando el split lo convertimos a un arreglo y extramos los dos
    const [type, token] = request.headers['authorization']?.split(' ') ?? [];
    //ahora vamos a retoranr el token siempre y cuando el tipo sea Bearer
    return type === 'Bearer' ? token : undefined;
  }
}
