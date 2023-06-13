import Upload from './upload'

export type { RcFile, UploadChangeParam, UploadFile, UploadProps } from './type'

export {
  checkType,
  checkShowIcon,
  getBase64,
  getFileItem,
  removeFileItem,
  file2Obj,
} from './utils'

export default Upload
