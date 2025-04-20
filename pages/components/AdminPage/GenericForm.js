import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';

function GenericForm({
  visible,
  item,
  fields = [],
  onChange,
  onSave,
  onHide,
  submitted,
  title
}) {
//   const footer = (
//     <React.Fragment>
//       <Button 
//         label="Hủy" 
//         icon="pi pi-times" 
//         outlined 
//         onClick={onHide} 
//       />
//       <Button 
//         label="Lưu" 
//         icon="pi pi-check" 
//         onClick={onSave} 
//       />
//     </React.Fragment>
//   );

  return (
    <Dialog
      visible={visible}
      style={{ width: '32rem' }}
      breakpoints={{ '960px': '75vw', '641px': '90vw' }}
      header={title}
      modal
      className="p-fluid"
    //   footer={footer}
      onHide={onHide}
    >
      {fields.map((field) => (
        !field.hidden && (
          <div className="field" key={field.name}>
            <label htmlFor={field.name} className="font-bold">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <InputText
              id={field.name}
              value={item[field.name] || ''}
              onChange={(e) => onChange(e, field.name)}
              required={field.required}
              disabled={field.disabled}
              autoFocus={field.autoFocus}
              className={classNames({ 'p-invalid': submitted && field.required && !item[field.name] })}
            />
            {submitted && field.required && !item[field.name] && (
              <small className="p-error">{field.label} không được để trống</small>
            )}
          </div>
        )
      ))}
    </Dialog>
  );
}

export default GenericForm;