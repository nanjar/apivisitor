export class CompanyPicDto {
  id: number;
  fullname: string;
  jobTitle: string | null;
  phone: string;
  email: string | null;
}

export class CompanyDetailResponseDto {
  id: number;
  companyName: string;
  details: string | null;
  logo: string | null;
  country: string | null;
  companyWebsite: string | null;
  companyProfileUrl: string | null;
  venueName: string | null;
  hallLabel: string | null;
  boothLabel: string | null;
  isFavorited: boolean;
  pics: CompanyPicDto[];
  totalProducts: number;
}
