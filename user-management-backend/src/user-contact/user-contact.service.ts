import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserContactDto } from './dto/create-user-contact.dto';
import { UpdateUserContactDto } from './dto/update-user-contact.dto';
import { UserContact } from './entities/user-contact.entity';

@Injectable()
export class UserContactService {
  constructor(
    @InjectRepository(UserContact)
    private readonly userContactRepository: Repository<UserContact>,
  ) {}

  async create(createUserContactDto: CreateUserContactDto): Promise<UserContact> {
    if (!createUserContactDto.email && !createUserContactDto.phone) {
      throw new BadRequestException('Either email or phone must be provided.');
    }
    const newUserContact = this.userContactRepository.create(createUserContactDto);
    return this.userContactRepository.save(newUserContact);
  }

  async findAll(): Promise<UserContact[]> {
    return this.userContactRepository.find();
  }

  async findOne(id: number): Promise<UserContact> {
    const userContact = await this.userContactRepository.findOne({ where: { id } });
    if (!userContact) {
      throw new NotFoundException(`UserContact with ID #${id} not found`);
    }
    return userContact;
  }

  async update(id: number, updateUserContactDto: UpdateUserContactDto): Promise<UserContact> {
    // If updating to remove both email and phone, it should be handled based on business logic.
    // For now, allowing individual field updates. If both become null, it might be an issue.
    // Consider adding validation here if needed:
    // if (updateUserContactDto.email === null && updateUserContactDto.phone === null) {
    //   throw new BadRequestException('Either email or phone must be present.');
    // }

    const userContact = await this.userContactRepository.preload({
      id: id,
      ...updateUserContactDto,
    });
    if (!userContact) {
      throw new NotFoundException(`UserContact with ID #${id} not found`);
    }
    return this.userContactRepository.save(userContact);
  }

  async remove(id: number): Promise<void> {
    const result = await this.userContactRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`UserContact with ID #${id} not found`);
    }
  }
}
