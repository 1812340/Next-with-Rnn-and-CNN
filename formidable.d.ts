declare module 'formidable' {
    import { IncomingForm } from 'formidable';
    export default function formidable(options?: formidable.Options): IncomingForm;
    export = formidable;
  }