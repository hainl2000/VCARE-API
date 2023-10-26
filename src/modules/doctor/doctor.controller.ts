import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { hospitals } from '@prisma/client';
import { Account } from 'src/decorators/account.decorator';
import { AuthRole } from 'src/decorators/authorization.decorator';
import { CreateDoctorDto, DoctorResponse, UpdateDoctorDto } from './doctor.dto';
import { DoctorService } from './doctor.service';
import { accountWithRole } from 'src/constants/type';

@ApiTags('doctor')
@ApiConsumes('application/json')
@ApiBearerAuth('authorization')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ description: 'Tạo tài khoản bác sĩ' })
  @ApiCreatedResponse({
    type: DoctorResponse,
    description: 'Tạo tài khoản thành công thành công',
  })
  @AuthRole('hospital')
  @Post()
  create(@Body() data: CreateDoctorDto, @Account() hospital: hospitals) {
    return this.doctorService.create(data, hospital);
  }

  @AuthRole('hospital', 'doctor')
  @Put()
  updateDoctor(
    @Body() data: UpdateDoctorDto,
    @Account() account: accountWithRole,
  ) {
    if (account.role === 'doctor') {
      data.doctor_id = account.id;
    }
    const { doctor_id, ...updateData } = data;
    return this.doctorService.update(
      data.doctor_id,
      updateData,
      account as hospitals,
    );
  }
}
