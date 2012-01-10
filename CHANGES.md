# sdc-clients Changelog

## sdc-clients 7.0.0

- PROV-1371: Add MAPI.{listMachines,countMachines,getMachine,getMachineByAlias}
  methods. This is a start at methods for MAPI's new "/machines/..."
  endpoints.
  
  The following MAPI client methods are now deprecated: countZones,
  listZones, getZoneByAlias, getZone, countVirtualMachines, listVMs,
  getVirtualMachine, getVMByAlias.
  
  Note that these new client methods are closer to MAPI's actual
  behaviour than, e.g. `MAPI.getZones`. For example, specifying an owner
  uuid is optional, options match the MAPI names, destroyed machines are
  returned.
  
  [Backward incompatible change.] Also adds an `errorFormatter` option to the
  MAPI constructor for translating MAPI error responses. A
  `MAPI.restifyErrorFormatter` is provided to get some Cavage-approved (TM)
  translation -- which was the old default behaviour:
  
        var client = new MAPI({
          ...,
          errorFormatter: MAPI.restifyErrorFormatter
        });

- PROV-1370: MAPI.{count,list}{Zones,VMs}: drop 'all*' options. Just always
  set 'X-Joyent-Ignore-Provisioning-State' header.

- PROV-1369: `count` in callback from `MAPI.countVMs` and `MAPI.countZones` 


## sdc-clients 6.1.0

This version stuck around for a long time, from SDC 6.1 through all SDC 6.5 releases.
Initially it was set to match the SDC release version, but Mark has been shown
the error of his ways. We'll start fresh at version 7.0.0.
