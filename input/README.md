# Upload Excel files here

Upload the new Excel files into this folder (Add file → Upload files).
The app updates by itself in about 2–5 minutes.

File names must contain (upper/lower case and _ or space do not matter):

| File | Name must contain |
|---|---|
| IWP status | `IWP_Status` |
| Cable tracker | `Cable_Tracker` |
| RHI internal punch | `Internal_Punch` |
| Master (client) punch | `Master_Punch_List` |
| E&I equipment control (equipment RFI, subsystem) | `Equipment_Control` |
| Cable RAWP inspection progress (final cable RFI, IWP unique name, subsystem AKT) | `RAWP` |
| Documents register | `documents register` |
| Project TQ register | `Technical Query Register` |
| CTQ register | `CTQ Register` or `CCR TQ_Register` |
| NCR register (532RHI-QA-RGS-006) | `NCR_Register` |
| EP-3 E&I materials follow-up (stock / MRF) | `Materials_FollowUp` |
| Aleksy closure-confirmation file | any .xlsx with title `Подтверждение закрытия` |

Upload only the files that changed – the rest of the data is kept.
After the update the Excel files are removed from this folder and the result is in `LAST_UPDATE.txt`.
