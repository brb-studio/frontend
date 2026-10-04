/**
 * The only API paths the admin panel may reach through this server: staff resources, optionally one
 * by id, plus the few sub-actions the panel uses. The API still decides who may do what.
 */
const ADMIN_PATH =
  /^(tenant|branches|barbers|services|packages|promotions|users|time-off|appointments|availability)(\/[a-f\d]{24})?$/;

export const isAdminPath = (path: string) => ADMIN_PATH.test(path);
