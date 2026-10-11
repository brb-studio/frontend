const ADMIN_PATH =
  /^(tenant|branches|barbers|services|packages|promotions|users|time-off|appointments|availability)(\/[a-f\d]{24})?$|^payments(\/settings|\/[a-f\d]{24}\/(confirm|reject))?$|^earnings(\/appointments|\/payouts|\/barbers\/[a-f\d]{24})?$/;

export const isAdminPath = (path: string) => ADMIN_PATH.test(path);
